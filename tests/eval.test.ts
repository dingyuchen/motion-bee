import { evaluator, funcPool } from "../lib/eval";
import {
  AttributeType,
  BooleanFunc,
  CollectionFunc,
  Context,
  DateFunc,
  Expression,
  IdentityFunc,
  LogicalFunc,
  Model,
  ModelFunc,
  NumberFunc,
  OptionalFunc,
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

    const moreThanOrEqual: Expression = {
      args: [24, 20],
      op: NumberFunc.MoreThanOrEqual,
    };
    expect(evaluator(moreThanOrEqual, context)).toBe(true);
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

  test("Eval can handle lookups", () => {
    const modelInstance: Model = {
      attributes: [{ label: "age", type: AttributeType.Number, value: 24 }],
      type: AttributeType.Model,
      label: "person",
    };
    const modelCtx = {
      ...context,
      input: modelInstance,
    };

    const lookup: Expression = {
      args: ["age"],
      op: ModelFunc.Lookup,
    };

    expect(evaluator(lookup, modelCtx)).toBe(24);
  });

  test("Eval can handle nested models", () => {
    const personInstance: Model = {
      attributes: [{ label: "age", type: AttributeType.Number, value: 24 }],
      type: AttributeType.Model,
      label: "person",
    };

    const parentInstance: Model = {
      attributes: [
        { label: "child", type: AttributeType.Optional, value: personInstance },
        { label: "age", type: AttributeType.Number, value: 60 },
      ],
      type: AttributeType.Model,
      label: "parent",
    };

    const child: Expression = {
      args: ["child"],
      op: ModelFunc.Lookup,
    };
    const ageOfChild: Expression = {
      args: ["age", child],
      op: ModelFunc.Lookup,
    };
    const ctx = {
      ...context,
      input: parentInstance,
    };
    expect(evaluator(ageOfChild, ctx)).toBe(24);

    const parentOfChildAbove20YrsOld: Expression = {
      args: [
        "child",
        {
          args: [ageOfChild, 20],
          op: NumberFunc.MoreThanOrEqual,
        },
      ],
      op: OptionalFunc.ExistsAnd,
    };
    expect(evaluator(parentOfChildAbove20YrsOld, ctx)).toBe(true);
  });

  test("Eval can handle collections", () => {
    const alice: Model = {
      attributes: [
        { label: "vaccinated", type: AttributeType.Boolean, value: true },
        { label: "age", type: AttributeType.Number, value: 20 },
      ],
      type: AttributeType.Model,
      label: "person",
    };
    const bob: Model = {
      attributes: [
        { label: "vaccinated", type: AttributeType.Boolean, value: false },
        { label: "age", type: AttributeType.Number, value: 11 },
      ],
      type: AttributeType.Model,
      label: "person",
    };
    const charlie: Model = {
      attributes: [
        { label: "vaccinated", type: AttributeType.Boolean, value: true },
        { label: "age", type: AttributeType.Number, value: 90 },
      ],
      type: AttributeType.Model,
      label: "person",
    };
    const daniel: Model = {
      attributes: [
        { label: "vaccinated", type: AttributeType.Boolean, value: false },
        { label: "age", type: AttributeType.Number, value: 30 },
      ],
      type: AttributeType.Model,
      label: "person",
    };
    const groupInstance: Model = {
      attributes: [
        {
          label: "group",
          type: AttributeType.Collection,
          value: [alice, bob, charlie, daniel],
        },
        { label: "same household", type: AttributeType.Boolean, value: true },
      ],
      type: AttributeType.Model,
      label: "group",
    };
    const ctx = {
      ...context,
      input: groupInstance,
    };

    const isVaccinated: Expression = {
      args: [
        {
          args: ["vaccinated"],
          op: ModelFunc.Lookup,
        },
      ],
      op: BooleanFunc.IsChecked,
    };

    const allVaccinated: Expression = {
      args: [
        {
          args: ["group"],
          op: ModelFunc.Lookup,
        },
        {
          args: [isVaccinated],
          op: IdentityFunc.Lambda,
        },
      ],
      op: CollectionFunc.AllOf,
    };

    expect(evaluator(allVaccinated, ctx)).toBe(false);
  });
});
