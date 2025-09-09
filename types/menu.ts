export interface MenuItem {
  id: string;
  h: string;           // Name
  dp: number;          // Price in paise
  ct: string;          // Category
  veg: boolean;        // Vegetarian or not
  wt: string;          // Weight/portion
  en: string;          // Energy/calories
  i: string;           // Image URL
  itemPackage?: any;   // Optional fields for future use
  foodType?: number;
  imgData?: any;
  bestSeller?: boolean;
  combo?: boolean;
  comboItems?: any[];
  addOn?: boolean;
  addOnItems?: any[];
  preparationTime?: number;
  upgradable?: boolean;
  upsellable?: boolean;
  upgradeItems?: any[];
  upsellItems?: any[];
  preparationType?: string;
  ho?: string;
  dis?: any;
  sf?: any;
  fa?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface MenuData {
  defaultDisplatCat: string;
  defaultCatImgUrl: string;
  prepareDefaultTimeinMin: number;
  prepareCapTimeinMin: number;
  hideShowBeforeEndTimeinMin: number;
  statusUpdateTimeinSec: number;
  outletName: string;
  city: {
    id: number;
    name: string;
    region: string;
    hasSubCities: boolean;
    state: string;
    subcities: any;
    lat: string;
    lng: string;
    image: string | null;
    imageR: string | null;
  };
  r: any[];
  cat: string[];
  repeat: any;
  cats: any;
  aqt: number;
  nams: string;
  emptyCart: string;
  itemQuantityLimit: string;
  deliveryLocation: string;
  pu: any;
  ph: any;
  offers: any;
}
