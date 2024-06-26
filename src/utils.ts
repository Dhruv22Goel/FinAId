import Big from "big.js";
import { MutableRefObject } from "react";
import { Budget } from "./components/Budget/Budget";
import { CsvItem } from "./components/Budget/CsvItem";
import { ItemForm } from "./components/ItemForm/ItemForm";
import { SearchOption } from "./components/NavBar/NavBar";
import { currenciesMap } from "./lists/currenciesMap";

export const userLang = navigator.language;

export function getCountryCode(locale: string): string {
  return locale.split("-").length >= 2
    ? locale.split("-")[1].toUpperCase()
    : locale.toUpperCase();
}

export function getCurrencyCode(country: string): string {
  const countryIsInMap =
    currenciesMap[country as keyof typeof currenciesMap] !== undefined;

  if (countryIsInMap) {
    return currenciesMap[
      country as keyof typeof currenciesMap
    ] as unknown as string;
  }
  return "USD";
}

export const countryCode = getCountryCode(userLang);
export const initialCurrencyCode = getCurrencyCode(countryCode);

export function roundBig(number: Big, precision: number): number {
  return Big(number).round(precision, 1).toNumber();
}

export function calcTotal(values: ItemForm[]): Big {
  let total = Big(0);
  values &&
    values
      .filter((x) => !isNaN(x.value))
      .forEach((i) => (total = total.add(Big(i.value))));
  return total;
}

export function calcPercentage(
  itemValue: number,
  revenueTotal: number,
): number {
  const areRoundableNumbers =
    !isNaN(revenueTotal) && revenueTotal > 0 && !isNaN(itemValue);
  if (areRoundableNumbers) {
    const percentage = Big(itemValue).mul(100).div(revenueTotal);

    return roundBig(percentage, percentage.gte(1) ? 0 : 1);
  }
  return 0;
}

export function calc(
  itemValue: number,
  change: number,
  operation: string,
): number {
  let total = 0;
  const isActionableChange = !isNaN(itemValue) && change > 0;

  if (isActionableChange) {
    let newValue = Big(itemValue);
    const changeValue = Big(change);
    switch (operation) {
      case "add":
        newValue = newValue.add(changeValue);
        break;
      case "sub":
        newValue = newValue.sub(changeValue);
        break;
      case "mul":
        newValue = newValue.mul(changeValue);
        break;
      case "div":
        newValue = newValue.div(changeValue);
        break;
      default:
        throw new Error("operation not implemented");
    }
    total = roundBig(newValue, 2);
  }

  if (total >= 0) {
    return total;
  } else {
    return 0;
  }
}

export function calcAvailable(value: Budget | null): Big {
  if (value !== null) {
    const expenseTotal = calcTotal(value.expenses.items);
    const incomeTotal = calcTotal(value.incomes.items);
    return incomeTotal.sub(expenseTotal);
  }
  return Big(0);
}

export function calcWithGoal(value: Budget): number {
  const goalIsCalculable =
    value.stats.goal !== null && !isNaN(value.stats.goal);

  if (goalIsCalculable) {
    const available = calcAvailable(value);
    const availableWithGoal = Big(value.stats.goal)
      .mul(calcTotal(value.incomes.items))
      .div(100);
    return roundBig(available.sub(availableWithGoal), 2);
  }
  return 0;
}

export function calcSaved(value: Budget): number {
  const valueIsCalculable =
    value.stats.saved !== null && !isNaN(value.stats.goal);

  if (valueIsCalculable) {
    const available = calcTotal(value.incomes.items);
    const saved = Big(value.stats.goal).mul(available).div(100);
    return roundBig(saved, 2);
  }
  return 0;
}

export function calcAutoGoal(value: Budget): number {
  const valueIsCalculable =
    value.stats.goal !== null && !isNaN(value.stats.goal);

  if (valueIsCalculable) {
    const incomeTotal = calcTotal(value.incomes.items);
    const available = calcAvailable(value);

    if (incomeTotal.gt(0) && available.gt(0)) {
      const autoGoal = available.mul(100).div(incomeTotal);
      return roundBig(autoGoal, 5);
    }
  }
  return 0;
}

export function convertCsvToBudget(csv: string[], date: string): Budget {
  const emptyExpenses: ItemForm[] = [];
  const emptyIncomes: ItemForm[] = [];
  const newBudget = {
    id: crypto.randomUUID(),
    name: date,
    expenses: {
      items: emptyExpenses,
      total: 0,
    },
    incomes: {
      items: emptyIncomes,
      total: 0,
    },
    stats: {
      available: 0,
      withGoal: 0,
      saved: 0,
      goal: 0,
      reserves: 0,
    },
  };

  csv.forEach((value: string, key: number) => {
    const item = value as unknown as CsvItem;
    const newItemForm = new ItemForm({
      id: key,
      name: item.name,
      value: Number(item.value),
    });

    switch (item.type) {
      case "expense":
        newBudget.expenses.items.push(newItemForm);
        newBudget.expenses.total = roundBig(
          calcTotal(newBudget.expenses.items),
          2,
        );
        break;
      case "income":
        newBudget.incomes.items.push(newItemForm);
        newBudget.incomes.total = roundBig(
          calcTotal(newBudget.incomes.items),
          2,
        );
        break;
      case "goal":
        newBudget.stats.goal = Number(item.value);
        break;
      case "reserves":
        newBudget.stats.reserves = Number(item.value);
        break;
    }
  });

  newBudget.stats.available = roundBig(calcAvailable(newBudget), 2);
  newBudget.stats.withGoal = calcWithGoal(newBudget);
  newBudget.stats.saved = calcSaved(newBudget);

  return newBudget as unknown as Budget;
}

export function createNewBudget(): Budget {
  const newId = crypto.randomUUID();
  const year = new Date().getFullYear();
  const newBudget = {
    id: newId,
    name: `${year}-${newId.slice(0, 8)}`,
    expenses: {
      items: [{ id: 1, name: "", value: 0 }],
      total: 0,
    },
    incomes: {
      items: [{ id: 1, name: "", value: 0 }],
      total: 0,
    },
    stats: {
      available: 0,
      withGoal: 0,
      saved: 0,
      goal: 10,
      reserves: 0,
    },
  };

  return newBudget;
}

export function intlFormat(amount: number, currencyCode: string) {
  return new Intl.NumberFormat(userLang, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "symbol",
  }).format(amount);
}

export function focusRef(ref: MutableRefObject<HTMLInputElement | undefined>) {
  if (ref.current) {
    ref.current.focus();
  }
}

export function createBudgetNameList(list: Budget[]): SearchOption[] {
  return list
    .filter((b: Budget) => b.id !== undefined && b.name !== undefined)
    .map((b: Budget) => {
      return { id: b.id, item: "", name: b.name };
    });
}

export function parseLocaleNumber(
  stringNumber: string,
  locale: string | undefined,
): number {
  const thousandSeparator = Intl.NumberFormat(locale)
    .format(11111)
    .replace(/\p{Number}/gu, "");
  const decimalSeparator = Intl.NumberFormat(locale)
    .format(1.1)
    .replace(/\p{Number}/gu, "");

  return parseFloat(
    stringNumber
      .replace(new RegExp("\\" + thousandSeparator, "g"), "")
      .replace(new RegExp("\\" + decimalSeparator), "."),
  );
}

export function budgetToCsv(budget: Budget) {
  const header = ["type", "name", "value"];

  const expenses = budget.expenses.items.map((expense) => {
    return ["expense", expense.name, expense.value].join(",");
  });

  const incomes = budget.incomes.items.map((income) => {
    return ["income", income.name, income.value].join(",");
  });

  const stats = ["goal", "goal", budget.stats.goal.toString()].join(",");
  const reserves = [
    "reserves",
    "reserves",
    budget.stats.reserves.toString(),
  ].join(",");

  return [header, ...expenses, ...incomes, stats, reserves].join("\n");
}

export function median(arr: number[]): number {
  if (!arr.length) return 0;

  const s = [...arr].sort((a, b) => Big(a).minus(b).toNumber());
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0
    ? Big(s[mid - 1])
        .plus(s[mid])
        .div(2)
        .toNumber()
    : s[mid];
}

export function getNestedProperty<O, K extends keyof O, L extends keyof O[K]>(
  object: O,
  firstProp: K,
  secondProp: L,
): O[K][L] {
  return object[firstProp][secondProp];
}

export function getNestedValues<T, K extends keyof T, L extends keyof T[K]>(
  list: T[] | undefined,
  prop1: K,
  prop2: L,
): T[K][L][] {
  return list!.map((o: T) => {
    return getNestedProperty(o, prop1, prop2);
  });
}
/*Certainly! Let's delve deeper into the code and provide a more detailed explanation of each function and its purpose:

1. **Big.js and React Imports**:
   - `Big` from `"big.js"`: This library is used for precise decimal arithmetic, especially useful for financial calculations.
   - `MutableRefObject` from `"react"`: This is a type provided by React for managing mutable references within functional components.

2. **Constants**:
   - `userLang`: Stores the user's preferred language retrieved from the `navigator.language`.
   - `currenciesMap`: Likely a mapping of country codes to currency codes, used for determining currency based on locale.

3. **Utility Functions**:
   - **`getCountryCode(locale: string): string`**: Extracts the country code from a given locale string.
   - **`getCurrencyCode(country: string): string`**: Retrieves the currency code based on the country code.
   - **`roundBig(number: Big, precision: number): number`**: Rounds a Big.js number to a specified precision.
   - **`calcTotal(values: ItemForm[]): Big`**: Calculates the total value of a list of items (expenses or incomes).
   - **`calcPercentage(itemValue: number, revenueTotal: number): number`**: Calculates the percentage of an item's value relative to the .
   total revenue.
   - **`calc(itemValue: number, change: number, operation: string): number`**: Performs basic arithmetic operations on numbers (addition .
    subtraction, multiplication, division).
   - **`calcAvailable(value: Budget | null): Big`**: Calculates the available budget by subtracting total expenses from total incomes.
   - **`calcWithGoal(value: Budget): number`**: Calculates the available budget after considering a specified financial goal.
   - **`calcSaved(value: Budget): number`**: Calculates the amount saved towards a financial goal.
   - **`calcAutoGoal(value: Budget): number`**: Calculates an automatic financial goal based on available income.
   - **`convertCsvToBudget(csv: string[], date: string): Budget`**: Converts CSV data into a Budget object.
   - **`createNewBudget(): Budget`**: Creates a new Budget object with default values.
   - **`intlFormat(amount: number, currencyCode: string): string`**: Formats a number as currency based on the user's locale and currency 
   code.
   - **`focusRef(ref: MutableRefObject<HTMLInputElement | undefined>): void`**: Focuses on a DOM element referenced by a MutableRefObject.
   - **`createBudgetNameList(list: Budget[]): SearchOption[]`**: Creates a list of options for selecting a budget, likely for use in a. 
   dropdown menu.
   - **`parseLocaleNumber(stringNumber: string, locale: string | undefined): number`**: Parses a string representing a number with .
   locale-specific formatting.
   - **`budgetToCsv(budget: Budget): string`**: Converts a Budget object into a CSV string.
   - **`median(arr: number[]): number`**: Calculates the median value of an array of numbers.
   - **`getNestedProperty<O, K extends keyof O, L extends keyof O[K]>(object: O, firstProp: K, secondProp: L): O[K][L]`**: Accesses a .
   nested property within an object.
   - **`getNestedValues<T, K extends keyof T, L extends keyof T[K]>(list: T[] | undefined, prop1: K, prop2: L): T[K][L][]`**: Retrieves .
   nested property values from an array of objects.

These utility functions are critical for performing various tasks related to budget management, financial calculations, data .
manipulation, and internationalization within the React application. They encapsulate common operations, making the code more modular, 
reusable, and maintainable.*/
