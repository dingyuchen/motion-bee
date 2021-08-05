import { Eval, evaluator, funcPool } from "../lib/eval";
import {
  Context,
  DateFunc,
  Expression,
  LogicalFunc,
  NumberFunc,
} from "../lib/types";

describe("Evaluation tests", () => {
  let context: Context = {
    funcPool: funcPool,
    input: undefined,
  };
  beforeEach(() => {
    context = {
      funcPool: funcPool,
      input: undefined,
    };
  });

  test("Eval can evaluate boolean expressions", () => {
    const trueAndFalse: Expression = {
      args: [true, false],
      op: LogicalFunc.And,
    };
    expect(evaluator(trueAndFalse, context)).toBe(false);

    const trueAndTrue = {
      ...trueAndFalse,
      args: [true, true],
    };
    expect(evaluator(trueAndTrue, context)).toBe(true);

    const trueOrFalse = {
      args: [true, false],
      op: LogicalFunc.Or,
    };
    expect(evaluator(trueOrFalse, context)).toBe(true);

    const falseOrFalse = {
      args: [false, false],
      op: LogicalFunc.Or,
    };
    expect(evaluator(falseOrFalse, context)).toBe(false);
  });

  test("Eval can handle nested expressions", () => {
    const falseOrFalse = {
      args: [false, false],
      op: LogicalFunc.Or,
    };

    const trueAndTrue = {
      args: [true, true],
      op: LogicalFunc.And,
    };

    const expr: Expression = {
      args: [falseOrFalse, trueAndTrue],
      op: LogicalFunc.Or,
    };
    expect(evaluator(expr, context)).toBe(true);

    const expr2 = {
      ...expr,
      op: LogicalFunc.And,
    };
    expect(evaluator(expr2, context)).toBe(false);

    const not: Expression = {
      args: [expr2],
      op: LogicalFunc.Not,
    };
    expect(evaluator(not, context)).toBe(true);
  });

  test("Eval can handle numbers", () => {
    const expr: Expression = {
      args: [2, 3],
      op: NumberFunc.LessThanOrEqual,
    };
    expect(evaluator(expr, context)).toBe(true);
  });

  test("Eval can handle dates", () => {
    const refDate = Date.now();
    const before: Expression = {
      args: [refDate, refDate + 7000],
      op: DateFunc.IsBefore,
    };
    expect(evaluator(before, context)).toBe(true);

    const between: Expression = {
      args: [refDate, refDate - 7000, refDate + 3000],
      op: DateFunc.IsBetween,
    };
    expect(evaluator(between, context)).toBe(true);
  });
});
