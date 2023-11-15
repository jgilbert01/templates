export interface Category {
  key: string;
  order: number;
  content: string;
  icon?: string;
  roles: Array<string>;
  env: Array<string>;
  genericSecondRowNav?: boolean;
}

export interface LeftNavMicroAppMetadata {
  key: string;
  order: number;
  content: string;
  to: string;
  icon?: string;
  env: Array<string>;
  roles: Array<string>;
  deny?: Array<string>;
  allow?: Array<string>;
  category?: string; // matches category key
  subCategory?: string;
  subCategoryIcon?: string;
  rolesUserCustomExpression?: string;
  hideInSecondRowNav?: boolean;
}

export interface GlobalSearchOption {
  key: string;
  order: number;
  content: string;
  searchBy: string;
  env: Array<string>;
  roles: Array<string>;
}

export interface CountUpdatedEventProps {
  key: string;
  count: number;
  warning?: boolean;
}
