export interface Expr {
  args: Expression[] | Value[];
  op: FuncType;
}

export type Expression = Expr | Primitive;

export type FuncType =
  | IdentityFunc
  | LogicalFunc
  | DateFunc
  | NumberFunc
  | EnumFunc
  | BooleanFunc
  | CollectionFunc
  | OptionalFunc
  | ModelFunc;

export enum IdentityFunc {
  Lambda = "Lambda",
  // Variable = "Variable",
}

export enum LogicalFunc {
  And = "And",
  Or = "Or",
  Not = "Not",
}

export enum DateFunc {
  IsBefore = "IsBefore",
  IsAfter = "IsAfter",
  IsBetween = "IsBetween",
}

export enum NumberFunc {
  MoreThan = "MoreThan",
  LessThan = "LessThan",
  MoreThanOrEqual = "MoreThanOrEqual",
  LessThanOrEqual = "LessThanOrEqual",
  Equal = "Equal",
}

export enum EnumFunc {
  Is = "Is",
  IsNot = "IsNot",
}

export enum BooleanFunc {
  IsChecked = "IsChecked",
  IsNotChecked = "IsNotChecked",
}

export enum CollectionFunc {
  AllOf = "AllOf",
  NoneOf = "NoneOf",
  AnyOf = "AnyOf",
  NumberOf = "NoneOf",
}

export enum OptionalFunc {
  Exists = "Exists",
  ExistsAnd = "ExistsAnd",
}

export enum ModelFunc {
  Lookup = "Lookup",
  // Dereference = "Dereference",
}

export interface ModelDefinition {
  readonly name: string;
  readonly attributes: AttributeType;
}

export interface Attribute {
  readonly type: AttributeType;
  readonly label: string;
  readonly value?: Value;
}

export enum AttributeType {
  Date = 0,
  Number,
  Enum,
  Boolean,
  Collection,
  Optional,
  Model,
}

export interface Model extends Attribute {
  readonly type: AttributeType.Model;
  readonly attributes: Attribute[];
}

export interface Collection<V extends Value> extends Attribute {
  readonly type: AttributeType.Collection;
  readonly subtype: AttributeType;
  readonly value: V[];
}

export interface Optional<V extends Value> extends Attribute {
  readonly type: AttributeType.Optional;
  readonly subtype: AttributeType;
  readonly value?: V;
}

export type Enum = string;

export type Value = Model | Value[] | Primitive | undefined;

export type Primitive = Enum | Date | Number | boolean | Lambda;

export type Lambda = (Value, Context) => boolean;

export interface EvalOutput {
  output: boolean;
  explainer?: {
    expr: Expression;
    log: string;
  };
}

export type FuncPool = {
  [op in FuncType]: (Context, ...Value) => Value;
};

export interface Context {
  input: Model;
  funcPool: FuncPool;
}
