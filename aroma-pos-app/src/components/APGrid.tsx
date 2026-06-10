import React from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { ProductModel } from "../types/FormFieldSchema";

export interface TableComponentProps {

    selectedProduct: ProductModel | null;
    mode: "view" | "edit" | "add";
    formValues: ProductModel[];
    baseColumns: ColumnsType<ProductModel>;

    RowClick: (record: ProductModel, index: number) => void;

}

const APGrid: React.FC<TableComponentProps> = ({ selectedProduct, formValues, baseColumns, mode, RowClick }) => {

    const columns =
        selectedProduct || mode === "add"
            ? baseColumns.slice(0, 1)
            : baseColumns;

    return (


        <div className="lm-table-wrapper" style={{ overflowY: "auto", flex: 1 }}>
            <Table
                className="lm-table"
                columns={columns}
                dataSource={formValues}
                pagination={false}
                rowKey="productName"
                onRow={(record, index) => ({
                    onClick: () => RowClick(record, index!),
                    style: {
                        cursor: "pointer",
                        background:
                            selectedProduct?.productName === record.productName ? "#f0f7ff" : undefined
                    }
                })}

                scroll={{
                    x: "max-content",
                }}

            />

        </div>


    );
}
export default APGrid;

