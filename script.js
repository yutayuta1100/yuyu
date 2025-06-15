// クライアントサイドのスクリプト - APIキーは含まれていません

document.addEventListener('DOMContentLoaded', () => {
    
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
            alert(`以下のファイルはサポートされていません:\n${invalidFiles.join('\n')}\n\n対応形式: PNG, JPEG, GIF, WebP`);
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
        alert('テキスト情報または画像のいずれかを入力してください');
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
    resultsContent.innerHTML = '<div class="loading">分類中...</div>';
    
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
            throw new Error(error.error || 'API呼び出しに失敗しました');
        }
        
        const data = await response.json();
        displayResults(data.classification);
    } catch (error) {
        console.error('Classification error:', error);
        resultsContent.innerHTML = `<div class="error">エラーが発生しました: ${error.message}</div>`;
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