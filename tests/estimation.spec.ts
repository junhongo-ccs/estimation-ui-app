import { test, expect } from '@playwright/test';

// Set timeout to 120s for AI responses (sometimes LLMs are slow)
test.setTimeout(120000);

// Define scenarios for Matrix testing
const scenarios = [
    {
        name: 'Web Application Flow',
        choices: ['Webアプリケーション', '一般消費者向け', '必要', '非常に重視する', '10-20画面', 'はい、お願いします'],
        expectedKeywords: ['見積もり', 'ショッピング', 'デザイン', 'Flutter'], // Flutter is suggested for apps, but let's see AI response
    },
    {
        name: 'Mobile App with Flutter Flow',
        choices: ['モバイルアプリ', '一般消費者向け', '必要', '非常に重視する', '10-20画面', 'Flutter', 'はい、お願いします'],
        expectedKeywords: ['Flutter', 'モバイルアプリ', 'アイコン', 'ロゴ'],
    },
    {
        name: 'Edge Case - Irrelevant Question',
        choices: ['今日の天気は？'],
        expectedKeywords: ['申し訳ございません', '開発', '見積もり'],
    }
];

test.describe('AI Estimation System E2E Scenarios', () => {

    test('Scenario: Web Application with Detailed Design', async ({ page }) => {
        await page.goto('/');

        // 1. Initial Choice: Web Application
        await page.click('button:has-text("Webアプリケーション")');

        // 2. Wait for AI response and next options
        await page.waitForSelector('.ai-message');
        await page.waitForSelector('button:has-text("一般消費者向け")');

        // 3. Choice: General Public
        await page.click('button:has-text("一般消費者向け")');
        await page.waitForSelector('button:has-text("必要")');

        // 4. Choice: Icon/Logo Required
        await page.click('button:has-text("必要")');
        await page.waitForSelector('button:has-text("非常に重視する")');

        // 5. Choice: UI/UX Very Important
        await page.click('button:has-text("非常に重視する")');
        await page.waitForSelector('button:has-text("10-20画面")');

        // 6. Choice: 10-20 screens
        await page.click('button:has-text("10-20画面")');
        await page.waitForSelector('button:has-text("はい、お願いします")');

        // 7. Proceed to finalize
        await page.click('button:has-text("はい、お願いします")');

        // 8. Wait for final report
        await page.waitForSelector('#download-area');

        // 9. Assertions
        const content = await page.innerText('#chat-timeline');
        expect(content).toContain('プロジェクト見積もり・提案書');
        expect(content).toContain('デザイン費用');
    });

    test('Scenario: Mobile App Tech Selection', async ({ page }) => {
        await page.goto('/');

        await page.click('button:has-text("モバイルアプリ")');

        // Wait for Flutter choice
        await page.waitForSelector('button:has-text("Flutter")');
        const flutterBtn = page.locator('button:has-text("Flutter")');
        await expect(flutterBtn).toBeVisible();

        await flutterBtn.click();

        // Wait for next message
        await page.waitForSelector('.ai-message:has-text("Flutter")');

        const content = await page.innerText('#chat-timeline');
        expect(content).toContain('Flutter');
    });

    test('UX: "Other" button focus', async ({ page }) => {
        await page.goto('/');

        await page.click('button:has-text("その他")');

        // Check if user-input is focused using the built-in matcher
        const input = page.locator('#user-input');
        await expect(input).toBeFocused();
    });
});
