import { test, expect } from "@playwright/test";

test.describe("tasks page (authenticated)", () => {
  test("session is valid, categories, task create/complete/delete", async ({ page }) => {
    const categoryName = `E2E Category ${Date.now()}`;
    const taskTitle = `E2E Task ${Date.now()}`;

    await test.step("navigate to /bn/tasks without being bounced to login", async () => {
      await page.goto("/bn/tasks");
      await expect(page).toHaveURL(/\/bn\/tasks$/);
      await expect(page.getByRole("heading", { name: "আমার Tasks" })).toBeVisible();
    });

    const categorySelect = page.locator('select[name="categoryId"]');

    await test.step("category dropdown has at least 8 options (default seeded categories)", async () => {
      const optionCount = await categorySelect.locator("option").count();
      expect(optionCount).toBeGreaterThanOrEqual(8);
    });

    await test.step("create a custom category and see it in the dropdown", async () => {
      await page.getByPlaceholder("Category এর নাম").fill(categoryName);
      await page.locator('input[type="color"][name="color"]').fill("#22c55e");
      await page.getByRole("button", { name: "+ Custom Category যোগ করো" }).click();

      await expect(
        categorySelect.locator("option", { hasText: categoryName })
      ).toHaveCount(1);
    });

    const taskItem = page.locator("div.border.rounded-lg").filter({ hasText: taskTitle });

    await test.step("create a task with the new category and see it in the list with its badge", async () => {
      await page.getByPlaceholder("Task এর নাম").fill(taskTitle);
      await categorySelect.selectOption({ label: categoryName });
      await page.getByRole("button", { name: "Task যোগ করো" }).click();

      await expect(taskItem).toBeVisible();
      await expect(taskItem.locator("span", { hasText: categoryName })).toBeVisible();
      await expect(taskItem.locator("span.rounded-full")).toHaveCount(1);
    });

    await test.step("mark the task complete and see the strikethrough", async () => {
      await taskItem.getByRole("button", { name: "⬜" }).click();
      await expect(taskItem.locator("p", { hasText: taskTitle })).toHaveClass(/line-through/);
    });

    await test.step("delete the task and confirm it's gone", async () => {
      await taskItem.getByRole("button", { name: "মুছে ফেলো" }).click();
      await expect(
        page.locator("div.border.rounded-lg").filter({ hasText: taskTitle })
      ).toHaveCount(0);
    });
  });
});
