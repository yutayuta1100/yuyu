const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// セキュリティヘッダーの設定
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://pagead2.googlesyndication.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));

// CORS設定（本番環境では特定のドメインのみ許可）
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGIN || true
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
};
app.use(cors(corsOptions));

// JSONパーサー（画像アップロードのため容量を増やす）
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// レート制限（1時間あたり100リクエストまで）
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1時間
    max: 100,
    message: 'リクエスト制限を超えました。しばらくしてから再度お試しください。'
});

// APIエンドポイントにレート制限を適用
app.use('/api/', limiter);

// 静的ファイルの提供
app.use(express.static(path.join(__dirname)));

// ICF分類APIエンドポイント
app.post('/api/classify', async (req, res) => {
    try {
        const { patientData, images } = req.body;
        
        // 入力検証
        if (!patientData && (!images || images.length === 0)) {
            return res.status(400).json({
                error: 'テキスト情報または画像のいずれかを入力してください'
            });
        }
        
        // プロンプトの構築（script.jsから移植）
        const hasTextData = Object.values(patientData || {}).some(value => value && value.toString().trim() !== '');
        
        const prompt = buildPrompt(hasTextData, patientData, images);
        
        // OpenAI APIコール
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: 'system',
                        content: 'あなたはICF（国際生活機能分類）に精通した医療・福祉情報システムの開発者です。自由記述の臨床記録から情報を正確に抽出し、ICFのフレームワークに沿って構造化されたサマリーを生成します。必ずJSON形式で回答してください。ICFコードは使用せず、入力テキストの具体的な内容を詳細に抽出してください。要約は避け、元の文章の表現をそのまま使用し、できるだけ多くの情報を含めてください。'
                    },
                    {
                        role: 'user',
                        content: images && images.length > 0 ? [
                            {
                                type: 'text',
                                text: prompt
                            },
                            ...images.map(img => ({
                                type: 'image_url',
                                image_url: {
                                    url: `data:${img.mimeType};base64,${img.base64}`
                                }
                            }))
                        ] : prompt
                    }
                ],
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI API Error:', error);
            return res.status(response.status).json({
                error: error.error?.message || 'API呼び出しに失敗しました'
            });
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // JSON解析
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const classification = JSON.parse(jsonMatch[0]);
            res.json({ classification });
        } else {
            throw new Error('レスポンスからJSON形式のデータを抽出できませんでした');
        }
        
    } catch (error) {
        console.error('Classification error:', error);
        res.status(500).json({
            error: 'サーバーエラーが発生しました'
        });
    }
});

// プロンプト構築関数
function buildPrompt(hasTextData, patientData, images) {
    return `
# あなたの役割
あなたは、ICF（国際生活機能分類）に精通した優秀な医療・福祉情報システムの開発者です。特に、自由記述の臨床記録から情報を正確に抽出し、ICFのフレームワークに沿って構造化されたサマリーを生成するタスクを得意とします。

# 目的
${hasTextData ? '以下の患者情報' : ''}${hasTextData && images && images.length > 0 ? 'と' : ''}${images && images.length > 0 ? 'アップロードされた画像' : ''}を分析し、ICFの6つの構成要素に基づいたサマリーを生成してください。
**ICFコードと評価点は出力せず、入力テキストの具体的な内容を抽出・要約した結果を生成することがゴールです。**

${hasTextData && patientData ? `入力情報:${patientData.patientId ? `
- 患者ID: ${patientData.patientId}` : ''}${patientData.age ? `
- 年齢: ${patientData.age}歳` : ''}${patientData.gender ? `
- 性別: ${patientData.gender === 'male' ? '男性' : patientData.gender === 'female' ? '女性' : 'その他'}` : ''}${patientData.diagnosis ? `
- 診断名: ${patientData.diagnosis}` : ''}${patientData.symptoms ? `
- 症状・状態: ${patientData.symptoms}` : ''}${patientData.environmentalFactors ? `
- 環境因子: ${patientData.environmentalFactors}` : ''}${patientData.personalFactors ? `
- 個人因子: ${patientData.personalFactors}` : ''}` : ''}

${images && images.length > 0 ? `画像から患者の医療記録、検査結果、症状などの情報を読み取り、サマリー生成に活用してください。` : ''}

# 思考プロセス
1. **全体像の把握:** まず入力情報を完全に理解します。細かい情報も見逃さないよう注意深く読み取ります。
2. **情報のマッピング:** テキスト内の文章や単語が、ICFの「健康状態」「心身機能・身体構造」「活動」「参加」「環境因子」「個人因子」のどの項目に該当するかを特定します。
3. **詳細な記述:** 特定した情報を、**要約せずに詳細に記述**します。**元のテキストの言葉遣いや具体的な表現をそのまま使用**し、情報の欠落がないようにしてください。
4. **網羅的な抽出:** 推測可能な情報も含めて、できるだけ多くの情報を抽出します。一つの文章から複数の情報を読み取れる場合は、すべて記載してください。
5. **出力:** 最終的な結果を、下記の形式で生成します。各項目に最低でも2-3つ以上の具体的な記述を含めてください。

# 出力形式
必ず以下のJSON形式で回答してください：
{
  "healthCondition": {
    "currentMedicalHistory": "現病歴に関する詳細な記述（発症時期、症状の経過、治療内容、現在の状態など）",
    "pastMedicalHistory": "既往歴に関する詳細な記述（過去の疾患、手術歴、入院歴、アレルギー歴など）",
    "overview": "患者の全体像に関する詳細な記述（主訴、現在の健康状態、生活への影響、予後など）"
  },
  "bodyFunctionsAndStructures": {
    "functions": ["詳細な心身機能の記述1（例：嚥下機能、言語機能、認知機能、感覚機能など）", "詳細な心身機能の記述2", "詳細な心身機能の記述3"],
    "structures": ["詳細な身体構造の記述1（例：脳、神経系、筋骨格系の構造など）", "詳細な身体構造の記述2", "詳細な身体構造の記述3"],
    "impairments": ["詳細な機能障害の記述1（程度、部位、症状など）", "詳細な構造障害の記述2", "詳細な障害の記述3"]
  },
  "activities": {
    "capacity": ["詳細な能力の記述1（支援なしでできること）", "詳細な能力の記述2", "詳細な能力の記述3"],
    "performance": ["詳細な実行状況の記述1（実際の生活での遂行状況）", "詳細な実行状況の記述2", "詳細な実行状況の記述3"],
    "limitations": ["詳細な活動制限の記述1（困難な動作、必要な介助など）", "詳細な活動制限の記述2", "詳細な活動制限の記述3"]
  },
  "participation": {
    "participation": ["詳細な参加活動の記述1（現在参加している社会活動）", "詳細な参加活動の記述2", "詳細な参加活動の記述3"],
    "restrictions": ["詳細な参加制約の記述1（参加が困難になった活動）", "詳細な参加制約の記述2", "詳細な参加制約の記述3"]
  },
  "environmentalFactors": {
    "physical": ["詳細な物的環境の記述1（住環境、福祉用具、建築物など）", "詳細な物的環境の記述2", "詳細な物的環境の記述3"],
    "human": ["詳細な人的環境の記述1（家族、介護者、医療従事者など）", "詳細な人的環境の記述2", "詳細な人的環境の記述3"],
    "social": ["詳細な社会的環境の記述1（制度、サービス、地域資源など）", "詳細な社会的環境の記述2", "詳細な社会的環境の記述3"]
  },
  "personalFactors": ["詳細な個人因子の記述1（年齢、性別など）", "詳細な個人因子の記述2（性格、価値観など）", "詳細な個人因子の記述3（生活歴、職歴など）"]
}

重要: 
- ICFコード（例: b710.3）は含めないでください
- **元のテキストの具体的な表現をそのまま使用**してください（要約しない）
- 情報がない項目は空文字列または空配列として返してください
- **できるだけ詳細に記述**し、各カテゴリーで最低でも2-3つ以上の具体的な情報を含めてください
- 一つの症状や状態から、複数の側面（機能、活動、参加への影響など）を読み取って記載してください
- 患者の状態について、観察された事実だけでなく、それが日常生活にどのような影響を与えているかも記述してください
`;
}

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});