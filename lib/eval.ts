import {
  AttributeType,
  Enum,
  EvalOutput,
  Expression,
  IdentityFunc,
  Model,
  ModelFunc,
  OptionalFunc,
  Primitive,
  Value,
} from "./types";

const isModel = (input: Value): input is Model => {
  return (input as Model).attributes !== undefined;
};

export const funcPool = {
  Lookup: (label: Value, model: Value): Value => {
    if (!isModel(model)) {
      throw new Error(`Input: ${JSON.stringify(model)} is not a model instance`);
    }
    const matches = model.attributes.filter((attr) => attr.label === label);
    if (matches.length === 0) {
      throw new Error(`Label: ${label} of Model: ${model.label} does not exist`);
    } else if (matches.length > 1) {
      throw new Error(`Label: ${label} of Model: ${model.label} does not exist`);
    }
    return matches[0].value;
  },
  AllOf: (collection: Value[], subExpr: Expression): boolean => {
    return collection.every(toLambda(subExpr));
  },
  AnyOf: (collection: Value[], subExpr: Expression): boolean => {
    const el = collection.find(toLambda(subExpr));
    return !!el;
  },
  Equal: (x: Number, y: Number): boolean => x === y,
  Exists: (label: string, model: Model): boolean => !!funcPool[ModelFunc.Lookup](label, model),
  ExistsAnd: (label: string, model: Model) => funcPool[OptionalFunc.Exists](label, model),
  Is: (left: Enum, right: Enum) => left === right,
  IsAfter: (curr: Date, compr: Date) => curr > compr,
  IsBefore: (curr: Date, compr: Date) => curr < compr,
  IsBetween: (curr: Date, lower: Date, upper: Date) => lower < curr && curr < upper,
  IsChecked: (checkbox: boolean) => !!checkbox,
  IsNot: (left: Enum, right: Enum) => left !== right,
  IsNotChecked: (checkbox: boolean) => !checkbox,
  LessThan: (curr: Number, compr: Number) => curr < compr,
  LessThanOrEqual: (curr: Number, compr: Number) => curr <= compr,
  MoreThan: (curr: Number, compr: Number) => curr > compr,
  MoreThanOrEqual: (curr: Number, compr: Number) => curr >= compr,
  NoneOf: (collection: Model[], subExpr: Expression) => {
    const lambda = toLambda(subExpr);
    return collection.every((x) => !lambda(x));
  },
  And: (...args: boolean[]) => args.every((x) => x),
  Or: (...args: boolean[]) => !!args.find((x) => x),
  Not: (arg: boolean) => !arg,
};

const toLambda = (arg: Expression) => (model: Model) => {
  const result = evaluator(arg, model);
  if (typeof result === "boolean") {
    return result;
  }
  throw new Error("Not a valid Lambda expression");
};

const isPrimitive = (expr: Expression): expr is Primitive => {
  return !(typeof expr === "object");
};

export const evaluator = (expr: Expression, model?: Model): Value => {
  if (isPrimitive(expr)) {
    return expr as Value;
  }
  const { op, args } = expr;

  switch (op) {
    case OptionalFunc.ExistsAnd:
      return (() => {
        const [label, consequent] = [...args];
        if (funcPool[OptionalFunc.Exists](label as string, model)) {
          return evaluator(consequent as Expression, model);
        }
        return false;
      })();
    default:
      const resultParams = [...args.map((expr) => evaluator(expr, model)), model];
      // @ts-ignore
      return funcPool[op](...resultParams);
  }
};
