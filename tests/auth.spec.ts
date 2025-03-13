import { test, expect } from '@playwright/test';

function generateUniquePhone() {
  return `0912${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
}

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('shows login form with phone input initially', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ورود / ثبت نام' })).toBeVisible();
    await expect(page.getByLabel('شماره موبایل')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ادامه' })).toBeVisible();
  });

  test('validates phone number format', async ({ page }) => {      
    // Webkit and Safari Mobile fail to fill the phone input if we don't wait a bit for some reason! Could be framer-motion animation?
    await page.waitForTimeout(500);

    const phoneInput = page.getByLabel('شماره موبایل');

    // Invalid phone number
    await phoneInput.fill('123');
    await expect(phoneInput).toHaveValue('123');
    await page.getByRole('button', { name: 'ادامه' }).click();
    await expect(page.getByText('شماره موبایل نامعتبر است')).toBeVisible();

    // Valid phone number
    await phoneInput.fill('09123456789');
    await page.getByRole('button', { name: 'ادامه' }).click();
    // Should move to OTP step
    await expect(page.getByRole('heading', { name: 'کد تایید' })).toBeVisible();
  });

  test('handles OTP verification flow', async ({ page }) => {
    // Webkit and Safari Mobile fail to fill the phone input if we don't wait a bit for some reason! Could be framer-motion animation?
    await page.waitForTimeout(500);

    // Enter phone number first
    await page.getByLabel('شماره موبایل').fill('09123456789');
    await page.getByRole('button', { name: 'ادامه' }).click();

    // Verify OTP screen is shown
    await expect(page.getByRole('heading', { name: 'کد تایید' })).toBeVisible();
    await expect(page.getByText('کد تایید ارسال شده به شماره موبایل خود را وارد کنید')).toBeVisible();

    // Should show phone number for verification
    await expect(page.getByText('09123456789')).toBeVisible();

    // Enter the test environment OTP code
    await page.getByLabel('کد تایید').fill('31415');

    // Submit OTP
    await page.getByRole('button', { name: 'تایید' }).click();

    // Should proceed to password set step for new users
    await expect(page.getByRole('heading', { name: 'تعیین رمز عبور' })).toBeVisible();

    // Test going back
    await page.getByRole('button', { name: 'ویرایش' }).click();
    await expect(page.getByRole('heading', { name: 'ورود / ثبت نام' })).toBeVisible();
  });

  test('handles password set flow for new users', async ({ page }) => {
    // Generate a unique phone number for each test run
    const uniquePhone = generateUniquePhone();

    // Webkit and Safari Mobile fail to fill the phone input if we don't wait a bit for some reason! Could be framer-motion animation?
    await page.waitForTimeout(500);

    // Enter unique phone and OTP first
    await page.getByLabel('شماره موبایل').fill(uniquePhone);
    await page.getByRole('button', { name: 'ادامه' }).click();

    // Enter the test environment OTP code
    await page.getByLabel('کد تایید').fill('31415');
    await page.getByRole('button', { name: 'تایید' }).click();

    // Verify password set screen
    await expect(page.getByRole('heading', { name: 'تعیین رمز عبور' })).toBeVisible();

    // Test password validation
    await page.getByRole('textbox', { name: 'رمز عبور', exact: true }).fill('123'); // Too short
    await page.getByRole('textbox', { name: 'تکرار رمز عبور' }).fill('123');
    await page.getByRole('button', { name: 'تایید' }).click();
    await expect(page.getByText('رمز عبور باید حداقل ۶ کاراکتر باشد')).toBeVisible();

    // Test password mismatch
    await page.getByRole('textbox', { name: 'رمز عبور', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'تکرار رمز عبور' }).fill('password456');
    await page.getByRole('button', { name: 'تایید' }).click();
    await expect(page.getByText('رمز عبور و تکرار آن باید یکسان باشند')).toBeVisible();

    // Test valid password
    await page.getByRole('textbox', { name: 'رمز عبور', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'تکرار رمز عبور' }).fill('password123');
    await page.getByRole('button', { name: 'تایید' }).click();

    // Should proceed to name set step
    await expect(page.getByRole('heading', { name: 'تکمیل اطلاعات' })).toBeVisible();
  });

  test('handles name set flow', async ({ page }) => {
    const uniquePhone = generateUniquePhone();

    // Complete the registration flow up to the name set step
    await page.waitForTimeout(500);
    await page.getByLabel('شماره موبایل').fill(uniquePhone);
    await page.getByRole('button', { name: 'ادامه' }).click();
    await page.getByLabel('کد تایید').fill('31415');
    await page.getByRole('button', { name: 'تایید' }).click();
    await page.getByRole('textbox', { name: 'رمز عبور', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'تکرار رمز عبور' }).fill('password123');
    await page.getByRole('button', { name: 'تایید' }).click();

    // Now we're at the name set step
    await expect(page.getByRole('heading', { name: 'تکمیل اطلاعات' })).toBeVisible();

    // Test name validation
    await page.getByLabel('نام').fill('');
    await page.getByLabel('نام خانوادگی').fill('');
    await page.getByRole('button', { name: 'ادامه' }).click();

    // Fill valid names
    await page.getByLabel('نام').fill('John');
    await page.getByLabel('نام خانوادگی').fill('Doe');
    await page.getByRole('button', { name: 'ادامه' }).click();

    // Should redirect to chat page after successful registration
    await expect(page).toHaveURL('/chat');
  });

  test('handles existing user login flow', async ({ page }) => {
    // Enter existing user phone
    await page.getByLabel('شماره موبایل').fill('09123456789');
    await page.getByRole('button', { name: 'ادامه' }).click();

    // Should show password input
    await expect(page.getByRole('heading', { name: 'ورود' })).toBeVisible();

    // Test password visibility toggle
    const passwordInput = page.getByLabel('رمز عبور');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Enter password and submit
    await passwordInput.fill('password123');
    await page.getByRole('button', { name: 'تایید' }).click();

    // Should redirect to chat page after successful login
    await expect(page).toHaveURL('/chat');
  });
});
