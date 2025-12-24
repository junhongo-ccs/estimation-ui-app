// ============================================
// Configuration
// ============================================

const API_ENDPOINT = 'https://estimation-agent-endpoint.eastus2.inference.ml.azure.com/score';
const API_KEY = 'YOUR_API_KEY_HERE'; // TODO: Replace with actual API key

// ============================================
// Tab Switching
// ============================================

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab
        tab.classList.add('active');

        // Show corresponding content
        const tabName = tab.dataset.tab;
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// ============================================
// Form Submission - Estimate
// ============================================

document.getElementById('estimate-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        project_type: formData.get('project_type'),
        duration_months: parseInt(formData.get('duration_months')),
        team_size: parseInt(formData.get('team_size')),
        inquiry_type: 'development_estimate'
    };

    await submitToAgent(data);
});

// ============================================
// Form Submission - Design Consultation
// ============================================

document.getElementById('design-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        inquiry_type: 'design_consultation',
        design_phase: {
            wireframe_ready: formData.get('wireframe_ready') === 'on',
            design_company_selected: formData.get('design_company_selected') === 'on',
            figma_experience: formData.get('figma_experience'),
            screen_count: parseInt(formData.get('screen_count')),
            responsive_required: formData.get('responsive_required') === 'on'
        }
    };

    await submitToAgent(data);
});

// ============================================
// API Call
// ============================================

async function submitToAgent(data) {
    const loadingEl = document.getElementById('loading');
    const resultEl = document.getElementById('result');
    const resultContentEl = document.getElementById('result-content');

    // Show loading
    loadingEl.style.display = 'flex';
    resultEl.style.display = 'none';

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                user_input: data
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Hide loading, show result
        loadingEl.style.display = 'none';
        resultEl.style.display = 'block';

        // Display result
        resultContentEl.innerHTML = result.response || JSON.stringify(result, null, 2);

        // Scroll to result
        resultEl.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);

        // Hide loading, show error
        loadingEl.style.display = 'none';
        resultEl.style.display = 'block';
        resultContentEl.innerHTML = `
      <div style="color: var(--error);">
        <h3>エラーが発生しました</h3>
        <p>${error.message}</p>
        <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
          APIエンドポイントまたはAPIキーを確認してください。
        </p>
      </div>
    `;
    }
}

// ============================================
// Development Mode - Mock Response
// ============================================

// Uncomment this to test without API
/*
async function submitToAgent(data) {
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('result');
  const resultContentEl = document.getElementById('result-content');
  
  loadingEl.style.display = 'flex';
  resultEl.style.display = 'none';
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  loadingEl.style.display = 'none';
  resultEl.style.display = 'block';
  
  if (data.inquiry_type === 'development_estimate') {
    resultContentEl.innerHTML = `
      <div class="doc--8px">
        <h3>見積もり結果</h3>
        <p><strong>総額: ¥18,000,000</strong></p>
        <ul>
          <li>開発費: ¥12,600,000</li>
          <li>デザイン費: ¥3,600,000</li>
          <li>管理費: ¥1,800,000</li>
        </ul>
        <p>この見積もりは、${data.team_size}名のチームで${data.duration_months}ヶ月間の開発を想定しています。</p>
      </div>
    `;
  } else {
    resultContentEl.innerHTML = `
      <div class="doc--8px">
        <h3>デザインフェーズのアドバイス</h3>
        <p>画面数${data.design_phase.screen_count}画面のプロジェクトですね。</p>
        <h4>推奨事項:</h4>
        <ul>
          <li>ワイヤーフレームを作成してからデザイン会社に依頼しましょう</li>
          <li>Figmaでのデザイン制作を推奨します</li>
          <li>デザイン費用の目安: ¥400,000 - ¥800,000</li>
          <li>納期の目安: 4-6週間</li>
        </ul>
      </div>
    `;
  }
  
  resultEl.scrollIntoView({ behavior: 'smooth' });
}
*/
