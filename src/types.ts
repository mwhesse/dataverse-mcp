// Dataverse Entity/Table Types
export interface EntityMetadata {
  "@odata.type": string;
  MetadataId: string;
  LogicalName: string;
  DisplayName: LocalizedLabel;
  DisplayCollectionName: LocalizedLabel;
  Description?: LocalizedLabel;
  SchemaName: string;
  EntitySetName: string;
  PrimaryIdAttribute: string;
  PrimaryNameAttribute?: string;
  OwnershipType: OwnershipTypes;
  IsCustomEntity: boolean;
  IsManaged: boolean;
  IsActivity: boolean;
  HasActivities: boolean;
  HasNotes: boolean;
  HasFeedback: boolean;
  IsValidForQueue: boolean;
  IsConnectionsEnabled: boolean;
  IsDocumentManagementEnabled: boolean;
  IsMailMergeEnabled: boolean;
  IsOfflineInMobileClient: boolean;
  IsReadOnlyInMobileClient: boolean;
  IsVisibleInMobile: boolean;
  IsVisibleInMobileClient: boolean;
  IsAuditEnabled: boolean;
  IsReplicateable: boolean;
  IsDuplicateDetectionEnabled: boolean;
  CanCreateAttributes: boolean;
  CanCreateForms: boolean;
  CanCreateViews: boolean;
  CanCreateCharts: boolean;
  CanBeRelatedEntityInRelationship: boolean;
  CanBePrimaryEntityInRelationship: boolean;
  CanBeInManyToMany: boolean;
  CanEnableSyncToExternalSearchIndex: boolean;
  SyncToExternalSearchIndex: boolean;
  ChangeTrackingEnabled: boolean;
  CollectionSchemaName: string;
  ExternalCollectionName?: string;
  ExternalName?: string;
  TableType: string;
}

export interface AttributeMetadata {
  "@odata.type": string;
  MetadataId: string;
  LogicalName: string;
  SchemaName: string;
  DisplayName: LocalizedLabel;
  Description?: LocalizedLabel;
  AttributeType: AttributeTypeCode;
  AttributeTypeName: AttributeTypeDisplayName;
  IsPrimaryId: boolean;
  IsPrimaryName: boolean;
  IsValidForCreate: boolean;
  IsValidForRead: boolean;
  IsValidForUpdate: boolean;
  IsValidForAdvancedFind: boolean;
  CanBeSecuredForRead: boolean;
  CanBeSecuredForCreate: boolean;
  CanBeSecuredForUpdate: boolean;
  IsAuditEnabled: boolean;
  IsManaged: boolean;
  IsCustomAttribute: boolean;
  RequiredLevel: AttributeRequiredLevel;
  IsRenameable: boolean;
  IsValidODataAttribute: boolean;
  ExternalName?: string;
  SourceType: number;
}

export interface BooleanAttributeMetadata extends AttributeMetadata {
  "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata";
  DefaultValue: boolean;
  OptionSet: BooleanOptionSetMetadata;
}

export interface StringAttributeMetadata extends AttributeMetadata {
  "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata";
  MaxLength: number;
  Format: StringFormat;
  ImeMode: ImeMode;
  IsLocalizable: boolean;
  YomiOf?: string;
}

export interface IntegerAttributeMetadata extends AttributeMetadata {
  "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata";
  Format: IntegerFormat;
  MaxValue: number;
  MinValue: number;
}

export interface DecimalAttributeMetadata extends AttributeMetadata {
  "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata";
  MaxValue: number;
  MinValue: number;
  Precision: number;
  ImeMode: ImeMode;
}

export interface DateTimeAttributeMetadata extends AttributeMetadata {
  "@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata";
  Format: DateTimeFormat;
  ImeMode: ImeMode;
  DateTimeBehavior: DateTimeBehavior;
}

export interface PicklistAttributeMetadata extends AttributeMetadata {
  "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata";
  OptionSet: OptionSetMetadata;
  DefaultFormValue?: number;
}

export interface LookupAttributeMetadata extends AttributeMetadata {
  "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata";
  Targets: string[];
}

// Option Set Types
export interface OptionSetMetadata {
  "@odata.type": string;
  MetadataId: string;
  Name: string;
  DisplayName: LocalizedLabel;
  Description?: LocalizedLabel;
  OptionSetType: OptionSetType;
  IsCustomOptionSet: boolean;
  IsGlobal: boolean;
  IsManaged: boolean;
  Options: OptionMetadata[];
  IntroducedVersion: string;
}

export interface BooleanOptionSetMetadata {
  "@odata.type": "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata";
  MetadataId: string;
  TrueOption: OptionMetadata;
  FalseOption: OptionMetadata;
}

export interface OptionMetadata {
  Value: number;
  Label: LocalizedLabel;
  Description?: LocalizedLabel;
  Color?: string;
  IsManaged: boolean;
  ExternalValue?: string;
}

// Relationship Types
export interface RelationshipMetadataBase {
  "@odata.type": string;
  MetadataId: string;
  SchemaName: string;
  RelationshipType: RelationshipType;
  IsCustomRelationship: boolean;
  IsValidForAdvancedFind: boolean;
  IsManaged: boolean;
  SecurityTypes: SecurityTypes;
  IntroducedVersion: string;
}

export interface OneToManyRelationshipMetadata extends RelationshipMetadataBase {
  "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata";
  ReferencedEntity: string;
  ReferencedAttribute: string;
  ReferencingEntity: string;
  ReferencingAttribute: string;
  ReferencedEntityNavigationPropertyName?: string;
  ReferencingEntityNavigationPropertyName?: string;
  CascadeConfiguration: CascadeConfiguration;
  AssociatedMenuConfiguration: AssociatedMenuConfiguration;
  IsHierarchical: boolean;
}

export interface ManyToManyRelationshipMetadata extends RelationshipMetadataBase {
  "@odata.type": "Microsoft.Dynamics.CRM.ManyToManyRelationshipMetadata";
  Entity1LogicalName: string;
  Entity1AssociatedMenuConfiguration: AssociatedMenuConfiguration;
  Entity2LogicalName: string;
  Entity2AssociatedMenuConfiguration: AssociatedMenuConfiguration;
  IntersectEntityName: string;
}

// Supporting Types
export interface LocalizedLabel {
  LocalizedLabels: LocalizedLabelValue[];
  UserLocalizedLabel: LocalizedLabelValue;
}

export interface LocalizedLabelValue {
  Label: string;
  LanguageCode: number;
  IsManaged: boolean;
  MetadataId: string;
  HasChanged?: boolean;
}

export interface CascadeConfiguration {
  Assign: CascadeType;
  Delete: CascadeType;
  Merge: CascadeType;
  Reparent: CascadeType;
  Share: CascadeType;
  Unshare: CascadeType;
  RollupView: CascadeType;
}

export interface AssociatedMenuConfiguration {
  Behavior: AssociatedMenuBehavior;
  Group: AssociatedMenuGroup;
  Label?: LocalizedLabel;
  Order?: number;
}

// Enums
export enum OwnershipTypes {
  None = 0,
  UserOwned = 1,
  TeamOwned = 2,
  BusinessOwned = 4,
  OrganizationOwned = 8,
  BusinessParented = 16
}

export enum AttributeTypeCode {
  Boolean = 0,
  Customer = 1,
  DateTime = 2,
  Decimal = 3,
  Double = 4,
  Integer = 5,
  Lookup = 6,
  Memo = 7,
  Money = 8,
  Owner = 9,
  PartyList = 10,
  Picklist = 11,
  State = 12,
  Status = 13,
  String = 14,
  Uniqueidentifier = 15,
  CalendarRules = 16,
  Virtual = 17,
  BigInt = 18,
  ManagedProperty = 19,
  EntityName = 20
}

export interface AttributeTypeDisplayName {
  Value: string;
}

export interface AttributeRequiredLevel {
  Value: string;
  CanBeChanged: boolean;
  ManagedPropertyLogicalName: string;
}

export enum StringFormat {
  Email = 0,
  Text = 1,
  TextArea = 2,
  Url = 3,
  TickerSymbol = 4,
  PhoneticGuide = 5,
  VersionNumber = 6,
  Phone = 7
}

export enum IntegerFormat {
  None = 0,
  Duration = 1,
  TimeZone = 2,
  Language = 3,
  Locale = 4
}

export enum DateTimeFormat {
  DateOnly = 0,
  DateAndTime = 1
}

export interface DateTimeBehavior {
  Value: string;
}

export enum ImeMode {
  Auto = 0,
  Inactive = 1,
  Active = 2,
  Disabled = 3
}

export enum OptionSetType {
  Picklist = 0,
  State = 1,
  Status = 2,
  Boolean = 3
}

export enum RelationshipType {
  OneToManyRelationship = 0,
  ManyToManyRelationship = 1
}

export enum SecurityTypes {
  None = 0,
  Append = 1,
  ParentChild = 2,
  Pointer = 4,
  Inheritance = 8
}

export enum CascadeType {
  NoCascade = 0,
  Cascade = 1,
  Active = 2,
  UserOwned = 3,
  RemoveLink = 4,
  Restrict = 5
}

export enum AssociatedMenuBehavior {
  UseCollectionName = 0,
  UseLabel = 1,
  DoNotDisplay = 2
}

export enum AssociatedMenuGroup {
  Details = 0,
  Sales = 1,
  Service = 2,
  Marketing = 3
}

// API Response Types
export interface ODataResponse<T> {
  "@odata.context": string;
  value: T[];
}

export interface ODataSingleResponse<T> {
  "@odata.context": string;
  "@odata.etag"?: string;
  value: T;
}