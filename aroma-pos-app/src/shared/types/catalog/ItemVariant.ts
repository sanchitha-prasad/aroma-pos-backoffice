import { ItemVarientStatusType } from '../../enums';

export interface ItemVariant {
    variantId: string;
    price: number;
    status: ItemVarientStatusType;
    variantName?: string;
}
