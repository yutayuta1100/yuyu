// クライアントサイドのスクリプト - APIキーは含まれていません

// 言語設定
const translations = {
    ja: {
        title: "ICF自動分類システム",
        subtitle: "患者情報を入力して、ICF（国際生活機能分類）に基づく分類を行います",
        inputTitle: "患者情報入力",
        inputNote: "※画像のみ、またはテキスト入力のみ、両方の組み合わせでもICF分類が可能です",
        age: "年齢",
        gender: "性別",
        selectOption: "選択してください",
        male: "男性",
        female: "女性",
        other: "その他",
        diagnosis: "診断名",
        symptoms: "症状・状態",
        symptomsPlaceholder: "患者の症状、身体機能、活動状況、参加状況などを詳しく記載してください",
        environmentalFactors: "環境因子",
        environmentalFactorsPlaceholder: "家族構成、住環境、社会的支援など",
        personalFactors: "個人因子",
        personalFactorsPlaceholder: "職業、趣味、生活習慣など",
        imageUpload: "画像アップロード",
        imageUploadHelp: "医療記録や検査結果の画像をアップロードできます（複数可）<br>対応形式: PNG, JPEG, GIF, WebP",
        submit: "ICF分類を実行",
        resultsTitle: "ICF分類結果",
        loading: "分類を実行しています...",
        error: "エラーが発生しました: ",
        apiError: "APIエラー: ",
        imageFormatError: "以下のファイルはサポートされていません:",
        inputRequired: "テキスト情報または画像のいずれかを入力してください",
        termsLink: "利用規約・プライバシーポリシー",
        copyright: "© 2024 ICF自動分類システム",
        privacyNotice: "プライバシー保護: アップロードされた画像は処理後直ちに削除され、サーバーには保存されません。",
        primaryMethod: "画像から分類（推奨）",
        optionalMethod: "手動入力（オプション）",
        uploadPrompt: "医療記録や検査結果の画像をドラッグ＆ドロップ<br>またはクリックして選択",
        filesSelected: "{count}個のファイルが選択されました"
    },
    en: {
        title: "ICF Automatic Classification System",
        subtitle: "Enter patient information for classification based on ICF (International Classification of Functioning)",
        inputTitle: "Patient Information Input",
        inputNote: "※ICF classification is possible with images only, text input only, or a combination of both",
        age: "Age",
        gender: "Gender",
        selectOption: "Please select",
        male: "Male",
        female: "Female",
        other: "Other",
        diagnosis: "Diagnosis",
        symptoms: "Symptoms/Condition",
        symptomsPlaceholder: "Please describe the patient's symptoms, physical function, activity status, participation status, etc. in detail",
        environmentalFactors: "Environmental Factors",
        environmentalFactorsPlaceholder: "Family structure, living environment, social support, etc.",
        personalFactors: "Personal Factors",
        personalFactorsPlaceholder: "Occupation, hobbies, lifestyle habits, etc.",
        imageUpload: "Image Upload",
        imageUploadHelp: "You can upload images of medical records or test results (multiple allowed)<br>Supported formats: PNG, JPEG, GIF, WebP",
        submit: "Execute ICF Classification",
        resultsTitle: "ICF Classification Results",
        loading: "Performing classification...",
        error: "An error occurred: ",
        apiError: "API Error: ",
        imageFormatError: "The following files are not supported:",
        inputRequired: "Please enter either text information or images",
        termsLink: "Terms of Service & Privacy Policy",
        copyright: "© 2024 ICF Automatic Classification System",
        privacyNotice: "Privacy Protection: Uploaded images are deleted immediately after processing and are not stored on the server.",
        primaryMethod: "Classify from Images (Recommended)",
        optionalMethod: "Manual Input (Optional)",
        uploadPrompt: "Drag & drop medical records or test result images<br>or click to select",
        filesSelected: "{count} file(s) selected"
    }
};

let currentLang = localStorage.getItem('language') || 'ja';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    
    // テキストコンテンツを更新
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (translations[lang][key]) {
            elem.innerHTML = translations[lang][key];
        }
    });
    
    // プレースホルダーを更新
    document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
        const key = elem.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            elem.placeholder = translations[lang][key];
        }
    });
    
    // 言語切り替えボタンの表示を更新
    document.querySelector('.lang-ja').style.display = lang === 'ja' ? 'inline' : 'none';
    document.querySelector('.lang-en').style.display = lang === 'en' ? 'inline' : 'none';
}

function translate(key) {
    return translations[currentLang][key] || key;
}

document.addEventListener('DOMContentLoaded', () => {
    // 初期言語設定
    setLanguage(currentLang);
    
    // 言語切り替えボタンのイベント
    document.getElementById('langToggle').addEventListener('click', () => {
        setLanguage(currentLang === 'ja' ? 'en' : 'ja');
    });
    
    // オプション機能の折りたたみ
    const optionalFeature = document.querySelector('.optional-feature');
    const optionalTitle = optionalFeature.querySelector('h3');
    
    // 初期状態では折りたたむ
    optionalFeature.classList.add('collapsed');
    
    optionalTitle.addEventListener('click', () => {
        optionalFeature.classList.toggle('collapsed');
    });
    
    // ドラッグ&ドロップ機能
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('imageUpload');
    
    // ドラッグオーバー
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    // ドラッグリーブ
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    // ドロップ
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(files);
        }
    });
    
    // ファイル選択時の処理を共通化
    function handleFileSelect(files) {
        const fileCount = files.length;
        const uploadPrompt = document.querySelector('.upload-prompt p');
        if (fileCount > 0) {
            uploadPrompt.innerHTML = translate('filesSelected').replace('{count}', fileCount);
            uploadPrompt.style.color = '#27ae60';
        } else {
            uploadPrompt.innerHTML = translate('uploadPrompt');
            uploadPrompt.style.color = '#34495e';
        }
    }
    
    // ファイル選択時の動作確認とファイル形式チェック
    const imageUpload = document.getElementById('imageUpload');
    imageUpload.addEventListener('change', (e) => {
        const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        const files = e.target.files;
        const invalidFiles = [];
        
        for (let i = 0; i < files.length; i++) {
            if (!supportedTypes.includes(files[i].type.toLowerCase())) {
                invalidFiles.push(files[i].name);
            }
        }
        
        if (invalidFiles.length > 0) {
            alert(`${translate('imageFormatError')}\n${invalidFiles.join('\n')}\n\n${currentLang === 'ja' ? '対応形式: PNG, JPEG, GIF, WebP' : 'Supported formats: PNG, JPEG, GIF, WebP'}`);
            e.target.value = ''; // ファイル選択をクリア
            handleFileSelect([]); // プロンプトをリセット
        } else {
            handleFileSelect(files);
        }
    });

    document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    const imageFiles = document.getElementById('imageUpload').files;
    console.log('Image files:', imageFiles.length);
    
    const hasTextInput = ['age', 'gender', 'diagnosis', 'symptoms', 'environmentalFactors', 'personalFactors']
        .some(field => {
            const value = e.target[field].value;
            return value && value.trim() !== '';
        });
    
    if (!hasTextInput && imageFiles.length === 0) {
        alert(translate('inputRequired'));
        return;
    }
    
    const formData = new FormData(e.target);
    const patientData = {
        age: formData.get('age'),
        gender: formData.get('gender'),
        diagnosis: formData.get('diagnosis'),
        symptoms: formData.get('symptoms'),
        environmentalFactors: formData.get('environmentalFactors'),
        personalFactors: formData.get('personalFactors')
    };
    
    const imageDataPromises = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
        imageDataPromises.push(readImageAsBase64(imageFiles[i]));
    }
    
    let images = [];
    if (imageDataPromises.length > 0) {
        images = await Promise.all(imageDataPromises);
    }
    
    const resultsSection = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    
    resultsSection.style.display = 'block';
    resultsContent.innerHTML = `<div class="loading">${translate('loading')}</div>`;
    
    // 処理中は送信ボタンを無効化
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    
    try {
        // サーバーにAPIリクエストを送信
        const apiUrl = window.location.protocol === 'file:' 
            ? 'http://localhost:3000/api/classify' 
            : '/api/classify';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patientData,
                images
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || (currentLang === 'ja' ? 'API呼び出しに失敗しました' : 'API call failed'));
        }
        
        const data = await response.json();
        displayResults(data.classification);
    } catch (error) {
        console.error('Classification error:', error);
        resultsContent.innerHTML = `<div class="error">${translate('error')}${error.message}</div>`;
    } finally {
        // 重要: 画像データをメモリから完全に削除
        cleanupImageData();
        
        // 送信ボタンを再度有効化
        submitBtn.disabled = false;
        
        // フォームをリセット（画像ファイルの参照を削除）
        document.getElementById('imageUpload').value = '';
        
        // ガベージコレクションを促進
        images = null;
        imageDataPromises.length = 0;
    }
});

// 画像データのクリーンアップ関数
function cleanupImageData() {
    // キャンバス要素をすべて削除
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.remove();
    });
    
    // 画像要素をすべて削除
    const tempImages = document.querySelectorAll('img[data-temp="true"]');
    tempImages.forEach(img => {
        img.src = '';
        img.remove();
    });
    
    // FileReaderのクリーンアップ
    if (window.fileReaders) {
        window.fileReaders.forEach(reader => {
            if (reader.readyState === FileReader.LOADING) {
                reader.abort();
            }
        });
        window.fileReaders = [];
    }
}

// グローバルでFileReaderを追跡
window.fileReaders = [];

function readImageAsBase64(file) {
    return new Promise((resolve, reject) => {
        // 画像のリサイズ処理を追加
        const reader = new FileReader();
        window.fileReaders.push(reader); // FileReaderを追跡
        reader.onload = (e) => {
            const img = new Image();
            img.setAttribute('data-temp', 'true'); // 一時画像としてマーク
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 最大幅・高さを設定
                const maxWidth = 1200;
                const maxHeight = 1200;
                let width = img.width;
                let height = img.height;
                
                // アスペクト比を保持してリサイズ
                if (width > height) {
                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = width * (maxHeight / height);
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // JPEG形式で圧縮
                canvas.toBlob((blob) => {
                    const reader2 = new FileReader();
                    reader2.onload = (e2) => {
                        resolve({
                            base64: e2.target.result.split(',')[1],
                            mimeType: 'image/jpeg'
                        });
                    };
                    reader2.readAsDataURL(blob);
                }, 'image/jpeg', 0.8);
            };
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// API呼び出し関数はサーバーサイドに移動しました

function displayResults(classification) {
    const resultsContent = document.getElementById('resultsContent');
    
    // ICF分類表のタイトル
    let html = '<div class="icf-classification-table">';
    html += `<h3 class="icf-table-title">${currentLang === 'ja' ? 'ICF分類表' : 'ICF Classification Table'}</h3>`;
    
    // 1. 健康状態
    html += `
        <div class="icf-section">
            <h4 class="icf-section-title">${currentLang === 'ja' ? '1. 健康状態' : '1. Health Condition'}</h4>
            <div class="icf-section-content">
    `;
    
    if (classification.healthCondition && Object.values(classification.healthCondition).some(v => v)) {
        if (classification.healthCondition.currentMedicalHistory) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '現病歴' : 'Current Medical History'}:</strong> ${classification.healthCondition.currentMedicalHistory}</div>`;
        }
        if (classification.healthCondition.pastMedicalHistory) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '既往歴' : 'Past Medical History'}:</strong> ${classification.healthCondition.pastMedicalHistory}</div>`;
        }
        if (classification.healthCondition.overview) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '全体像' : 'Overview'}:</strong> ${classification.healthCondition.overview}</div>`;
        }
    } else {
        html += `<div class="icf-item no-data">${currentLang === 'ja' ? 'データなし' : 'No data'}</div>`;
    }
    
    html += '</div></div>';
    
    // 2. 心身機能・身体構造
    html += `
        <div class="icf-section">
            <h4 class="icf-section-title">${currentLang === 'ja' ? '2. 心身機能・身体構造' : '2. Body Functions & Structures'}</h4>
            <div class="icf-section-content">
    `;
    
    if (classification.bodyFunctionsAndStructures && Object.values(classification.bodyFunctionsAndStructures).some(v => v && v.length > 0)) {
        if (classification.bodyFunctionsAndStructures.functions && classification.bodyFunctionsAndStructures.functions.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '心身機能' : 'Body Functions'}:</strong><ul>`;
            classification.bodyFunctionsAndStructures.functions.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        if (classification.bodyFunctionsAndStructures.structures && classification.bodyFunctionsAndStructures.structures.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '身体構造' : 'Body Structures'}:</strong><ul>`;
            classification.bodyFunctionsAndStructures.structures.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        if (classification.bodyFunctionsAndStructures.impairments && classification.bodyFunctionsAndStructures.impairments.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '機能・構造障害' : 'Impairments'}:</strong><ul>`;
            classification.bodyFunctionsAndStructures.impairments.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
    } else {
        html += `<div class="icf-item no-data">${currentLang === 'ja' ? 'データなし' : 'No data'}</div>`;
    }
    
    html += '</div></div>';
    
    // 3. 活動
    html += `
        <div class="icf-section">
            <h4 class="icf-section-title">${currentLang === 'ja' ? '3. 活動' : '3. Activities'}</h4>
            <div class="icf-section-content">
    `;
    
    if (classification.activities && Object.values(classification.activities).some(v => v && v.length > 0)) {
        if (classification.activities.capacity && classification.activities.capacity.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '能力' : 'Capacity'}:</strong><ul>`;
            classification.activities.capacity.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        if (classification.activities.performance && classification.activities.performance.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '実行状況' : 'Performance'}:</strong><ul>`;
            classification.activities.performance.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        if (classification.activities.limitations && classification.activities.limitations.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '活動制限' : 'Activity Limitations'}:</strong><ul>`;
            classification.activities.limitations.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
    } else {
        html += `<div class="icf-item no-data">${currentLang === 'ja' ? 'データなし' : 'No data'}</div>`;
    }
    
    html += '</div></div>';
    
    // 4. 参加
    html += `
        <div class="icf-section">
            <h4 class="icf-section-title">${currentLang === 'ja' ? '4. 参加' : '4. Participation'}</h4>
            <div class="icf-section-content">
    `;
    
    if (classification.participation && Object.values(classification.participation).some(v => v && v.length > 0)) {
        if (classification.participation.participation && classification.participation.participation.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '参加' : 'Participation'}:</strong><ul>`;
            classification.participation.participation.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        if (classification.participation.restrictions && classification.participation.restrictions.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '参加制約' : 'Participation Restrictions'}:</strong><ul>`;
            classification.participation.restrictions.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
    } else {
        html += `<div class="icf-item no-data">${currentLang === 'ja' ? 'データなし' : 'No data'}</div>`;
    }
    
    html += '</div></div>';
    
    // 5. 環境因子
    html += `
        <div class="icf-section">
            <h4 class="icf-section-title">${currentLang === 'ja' ? '5. 環境因子' : '5. Environmental Factors'}</h4>
            <div class="icf-section-content">
    `;
    
    if (classification.environmentalFactors && Object.values(classification.environmentalFactors).some(v => v && v.length > 0)) {
        if (classification.environmentalFactors.physical && classification.environmentalFactors.physical.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '物的環境' : 'Physical Environment'}:</strong><ul>`;
            classification.environmentalFactors.physical.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        if (classification.environmentalFactors.human && classification.environmentalFactors.human.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '人的環境' : 'Human Environment'}:</strong><ul>`;
            classification.environmentalFactors.human.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        if (classification.environmentalFactors.social && classification.environmentalFactors.social.length > 0) {
            html += `<div class="icf-item"><strong>${currentLang === 'ja' ? '社会的環境' : 'Social Environment'}:</strong><ul>`;
            classification.environmentalFactors.social.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
    } else {
        html += `<div class="icf-item no-data">${currentLang === 'ja' ? 'データなし' : 'No data'}</div>`;
    }
    
    html += '</div></div>';
    
    // 6. 個人因子
    html += `
        <div class="icf-section">
            <h4 class="icf-section-title">${currentLang === 'ja' ? '6. 個人因子' : '6. Personal Factors'}</h4>
            <div class="icf-section-content">
    `;
    
    if (classification.personalFactors && classification.personalFactors.length > 0) {
        html += '<ul>';
        classification.personalFactors.forEach(item => {
            html += `<li>${item}</li>`;
        });
        html += '</ul>';
    } else {
        html += `<div class="icf-item no-data">${currentLang === 'ja' ? 'データなし' : 'No data'}</div>`;
    }
    
    html += '</div></div>';
    
    // 分類表を閉じる
    html += '</div>';
    
    resultsContent.innerHTML = html;
}

});