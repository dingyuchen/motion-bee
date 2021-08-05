import {
  Attribute,
  Collection,
  Context,
  Enum,
  EvalOutput,
  Expr,
  Expression,
  FuncPool,
  IdentityFunc,
  Lambda,
  Model,
  ModelFunc,
  Optional,
  OptionalFunc,
  Primitive,
  Value,
} from "./types";

export const funcPool: FuncPool = {
  Lookup: (label: string, model: Model): Value => {
    const matches = model.attributes.filter((attr) => attr.label === label);
    if (matches.length === 0) {
      throw new Error(
        `Label: ${label} of Model: ${model.label} does not exist`
      );
    } else if (matches.length > 1) {
      throw new Error(
        `Label: ${label} of Model: ${model.label} does not exist`
      );
    }
    return matches[0].value;
  },
  AllOf: (collection: Value[], lambda: (Value) => boolean): boolean => {
    return collection
      .map((input) => ({
        funcPool,
        input,
      }))
      .every(lambda);
  },
  AnyOf: (collection: Value[], lambda: (Value) => boolean): boolean => {
    const el = collection
      .map((input) => ({
        funcPool,
        input,
      }))
      .find(lambda);
    return !!el;
  },
  Equal: (x: Number, y: Number): boolean => x === y,
  Exists: (label: string, model: Model): boolean =>
    !!funcPool[ModelFunc.Lookup](label, model),
  ExistsAnd: (label: string, model: Model, nextExpr: boolean) =>
    funcPool[OptionalFunc.Exists](label, model) && nextExpr,
  Is: (left: Enum, right: Enum) => left === right,
  IsAfter: (curr: Date, compr: Date) => curr > compr,
  IsBefore: (curr: Date, compr: Date) => curr < compr,
  IsBetween: (curr: Date, lower: Date, upper: Date) =>
    lower < curr && curr < upper,
  IsChecked: (checkbox: boolean) => !!checkbox,
  IsNot: (left: Enum, right: Enum) => left !== right,
  IsNotChecked: (checkbox: boolean) => !checkbox,
  LessThan: (curr: Number, compr: Number) => curr < compr,
  LessThanOrEqual: (curr: Number, compr: Number) => curr <= compr,
  MoreThan: (curr: Number, compr: Number) => curr > compr,
  MoreThanOrEqual: (curr: Number, compr: Number) => curr >= compr,
  NoneOf: (collection: Value[], lambda: (Value) => boolean) => {
    return collection
      .map((input) => ({
        funcPool,
        input,
      }))
      .every((x) => !lambda(x));
  },
  Lambda: (arg: Expression) => (ctx: Context) => {
    const result = evaluator(arg, ctx);
    if (typeof result === "boolean") {
      return result;
    }
    throw new Error("Not a valid Lambda expression");
  },
  And: (left: boolean, right: boolean) => left && right,
  Or: (left: boolean, right: boolean) => left || right,
  Not: (arg: boolean) => !arg,
};

const isPrimitive = (expr: Expression): expr is Primitive => {
  return !(typeof expr === "object");
};

export const evaluator = (expr: Expression, ctx: Context): Value => {
  if (isPrimitive(expr)) {
    return expr as Value;
  }
  const { op, args } = expr;
  const { input, funcPool } = ctx;

  switch (op) {
    case OptionalFunc.ExistsAnd:
      return (() => {
        const [label, consequent, model] = [...args, input];
        if (funcPool[OptionalFunc.Exists](label, model)) {
          return evaluator(consequent as Expression, ctx);
        }
        return false;
      })();
    default:
      const resultParams = [...args.map((expr) => evaluator(expr, ctx)), input];
      // @ts-ignore
      return funcPool[op](...resultParams);
  }
};

export const Eval = (expr: Expression, ctx: Context): EvalOutput => {
  return { output: true };
};
