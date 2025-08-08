// クライアントサイドのスクリプト - APIキーは含まれていません

// 言語設定
const translations = {
    ja: {
        title: "ICF自動分類システム",
        subtitle: "患者情報を入力して、ICF（国際生活機能分類）に基づく分類を行います",
        inputTitle: "患者情報入力",
        inputNote: "※画像のみ、またはテキスト入力のみ、両方の組み合わせでもICF分類が可能です",
        patientId: "患者ID",
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
        copyright: "© 2024 ICF自動分類システム"
    },
    en: {
        title: "ICF Automatic Classification System",
        subtitle: "Enter patient information for classification based on ICF (International Classification of Functioning)",
        inputTitle: "Patient Information Input",
        inputNote: "※ICF classification is possible with images only, text input only, or a combination of both",
        patientId: "Patient ID",
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
        copyright: "© 2024 ICF Automatic Classification System"
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
        }
    });

    document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    const imageFiles = document.getElementById('imageUpload').files;
    console.log('Image files:', imageFiles.length);
    
    const hasTextInput = ['patientId', 'age', 'gender', 'diagnosis', 'symptoms', 'environmentalFactors', 'personalFactors']
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
        patientId: formData.get('patientId'),
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
    }
});

function readImageAsBase64(file) {
    return new Promise((resolve, reject) => {
        // 画像のリサイズ処理を追加
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
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
    
    let html = '';
    
    // 健康状態
    if (classification.healthCondition) {
        html += `
            <div class="icf-category">
                <h3>【健康状態】</h3>
                <div class="icf-items">
        `;
        
        if (classification.healthCondition.currentMedicalHistory) {
            html += `<div class="icf-item"><strong>現病歴:</strong> ${classification.healthCondition.currentMedicalHistory}</div>`;
        }
        
        if (classification.healthCondition.pastMedicalHistory) {
            html += `<div class="icf-item"><strong>既往歴:</strong> ${classification.healthCondition.pastMedicalHistory}</div>`;
        }
        
        if (classification.healthCondition.overview) {
            html += `<div class="icf-item"><strong>全体像:</strong> ${classification.healthCondition.overview}</div>`;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // 心身機能と身体構造
    if (classification.bodyFunctionsAndStructures) {
        html += `
            <div class="icf-category">
                <h3>【心身機能と身体構造】</h3>
                <div class="icf-items">
        `;
        
        if (classification.bodyFunctionsAndStructures.functions && classification.bodyFunctionsAndStructures.functions.length > 0) {
            html += `<div class="icf-item"><strong>心身機能:</strong><ul>`;
            classification.bodyFunctionsAndStructures.functions.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        if (classification.bodyFunctionsAndStructures.structures && classification.bodyFunctionsAndStructures.structures.length > 0) {
            html += `<div class="icf-item"><strong>身体構造:</strong><ul>`;
            classification.bodyFunctionsAndStructures.structures.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        if (classification.bodyFunctionsAndStructures.impairments && classification.bodyFunctionsAndStructures.impairments.length > 0) {
            html += `<div class="icf-item"><strong>機能と構造障害:</strong><ul>`;
            classification.bodyFunctionsAndStructures.impairments.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // 活動
    if (classification.activities) {
        html += `
            <div class="icf-category">
                <h3>【活動】</h3>
                <div class="icf-items">
        `;
        
        if (classification.activities.capacity && classification.activities.capacity.length > 0) {
            html += `<div class="icf-item"><strong>能力:</strong><ul>`;
            classification.activities.capacity.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        if (classification.activities.performance && classification.activities.performance.length > 0) {
            html += `<div class="icf-item"><strong>実行状況:</strong><ul>`;
            classification.activities.performance.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        if (classification.activities.limitations && classification.activities.limitations.length > 0) {
            html += `<div class="icf-item"><strong>活動制限:</strong><ul>`;
            classification.activities.limitations.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // 参加
    if (classification.participation) {
        html += `
            <div class="icf-category">
                <h3>【参加】</h3>
                <div class="icf-items">
        `;
        
        if (classification.participation.participation && classification.participation.participation.length > 0) {
            html += `<div class="icf-item"><strong>参加:</strong><ul>`;
            classification.participation.participation.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        if (classification.participation.restrictions && classification.participation.restrictions.length > 0) {
            html += `<div class="icf-item"><strong>参加制約:</strong><ul>`;
            classification.participation.restrictions.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // 環境因子
    if (classification.environmentalFactors) {
        html += `
            <div class="icf-category">
                <h3>【環境因子】</h3>
                <div class="icf-items">
        `;
        
        if (classification.environmentalFactors.physical && classification.environmentalFactors.physical.length > 0) {
            html += `<div class="icf-item"><strong>物的な環境:</strong><ul>`;
            classification.environmentalFactors.physical.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        if (classification.environmentalFactors.human && classification.environmentalFactors.human.length > 0) {
            html += `<div class="icf-item"><strong>人的な環境:</strong><ul>`;
            classification.environmentalFactors.human.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        if (classification.environmentalFactors.social && classification.environmentalFactors.social.length > 0) {
            html += `<div class="icf-item"><strong>社会的な環境:</strong><ul>`;
            classification.environmentalFactors.social.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul></div>`;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // 個人因子
    if (classification.personalFactors && classification.personalFactors.length > 0) {
        html += `
            <div class="icf-category">
                <h3>【個人因子】</h3>
                <div class="icf-items">
                    <ul>
        `;
        
        classification.personalFactors.forEach(item => {
            html += `<li>${item}</li>`;
        });
        
        html += `
                    </ul>
                </div>
            </div>
        `;
    }
    
    resultsContent.innerHTML = html;
}

});