import {
  Attribute,
  Collection,
  Context,
  Enum,
  EvalOutput,
  Expression,
  FuncPool,
  Model,
  Optional,
  OptionalFunc,
  Primitive,
  Value,
} from "./types";

export const funcPool: FuncPool = {
  Lookup: (model: Model, label: string): Attribute => {
    const matches = model.attributes.filter((attr) => attr.label === label);
    if (matches.length === 0) {
      throw new Error(`Label: ${label} of Model: ${model.name} does not exist`);
    } else if (matches.length > 1) {
      throw new Error(`Label: ${label} of Model: ${model.name} does not exist`);
    }
    return matches[0];
  },
  AllOf: (
    collection: Collection<Attribute>,
    lambda: (Value) => boolean
  ): boolean => {
    return collection.value.every(lambda);
  },
  AnyOf: (
    collection: Collection<Attribute>,
    lambda: (Value) => boolean
  ): boolean => {
    const el = collection.value.find(lambda);
    return !!el;
  },
  Equal: (x: Number, y: Number): boolean => x === y,
  Exists: (attr: Optional<Attribute>): boolean => !!attr.value,
  ExistsAnd: (attr: Optional<Attribute>, nextExpr: boolean) =>
    funcPool[OptionalFunc.Exists](attr) && nextExpr,
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
  NoneOf: (collection: Collection<Attribute>, lambda: (Value) => boolean) => {
    return !collection.value.every(lambda);
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
  const { funcPool } = ctx;
  return funcPool[op](...args.map((expr) => evaluator(expr, ctx)));
};

export const Eval = (expr: Expression, ctx: Context): EvalOutput => {
  return { output: true };
};
