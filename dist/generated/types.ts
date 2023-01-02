/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */







declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
}

export interface NexusGenEnums {
  StatusEnum: "ACTIVE" | "DISABLED"
}

export interface NexusGenScalars {
  String: string
  Int: number
  Float: number
  Boolean: boolean
  ID: string
}

export interface NexusGenObjects {
  Account: { // root type
    id?: string | null; // ID
  }
  Event: { // root type
    astroid?: string | null; // String
    id?: string | null; // ID
    name?: string | null; // String
  }
  Query: {};
}

export interface NexusGenInterfaces {
  Node: NexusGenRootTypes['Account'] | NexusGenRootTypes['Event'];
}

export interface NexusGenUnions {
}

export type NexusGenRootTypes = NexusGenInterfaces & NexusGenObjects

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums

export interface NexusGenFieldTypes {
  Account: { // field return type
    email: string | null; // String
    id: string | null; // ID
    username: string | null; // String
  }
  Event: { // field return type
    astroid: string | null; // String
    id: string | null; // ID
    name: string | null; // String
  }
  Query: { // field return type
    account: Array<NexusGenRootTypes['Account'] | null> | null; // [Account]
    accountsById: Array<NexusGenRootTypes['Account'] | null> | null; // [Account]
    event: Array<NexusGenRootTypes['Event'] | null> | null; // [Event]
    hello: string | null; // String
  }
  Node: { // field return type
    id: string | null; // ID
  }
}

export interface NexusGenFieldTypeNames {
  Account: { // field return type name
    email: 'String'
    id: 'ID'
    username: 'String'
  }
  Event: { // field return type name
    astroid: 'String'
    id: 'ID'
    name: 'String'
  }
  Query: { // field return type name
    account: 'Account'
    accountsById: 'Account'
    event: 'Event'
    hello: 'String'
  }
  Node: { // field return type name
    id: 'ID'
  }
}

export interface NexusGenArgTypes {
  Query: {
    account: { // args
      name?: string | null; // String
      status?: NexusGenEnums['StatusEnum'] | null; // StatusEnum
    }
    accountsById: { // args
      ids?: Array<number | null> | null; // [Int]
    }
  }
}

export interface NexusGenAbstractTypeMembers {
  Node: "Account" | "Event"
}

export interface NexusGenTypeInterfaces {
  Account: "Node"
  Event: "Node"
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = never;

export type NexusGenEnumNames = keyof NexusGenEnums;

export type NexusGenInterfaceNames = keyof NexusGenInterfaces;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = "Account";

export type NexusGenAbstractsUsingStrategyResolveType = never;

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false
    resolveType: true
    __typename: false
  }
}

export interface NexusGenTypes {
  context: any;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}


declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginInputTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginSchemaConfig {
  }
  interface NexusGenPluginArgConfig {
  }
}