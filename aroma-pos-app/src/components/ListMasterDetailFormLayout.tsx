import React from "react";
import { Layout, Button, Typography } from "antd";
import { Header } from "antd/es/layout/layout";
import { PlusOutlined } from "@ant-design/icons";


const { Sider } = Layout;
const { Title } = Typography

interface PageLayoutProps {
    children: React.ReactNode;
    pageTitle: string;

    handleAddNew: () => void
}

function renderRightPanel(el: React.ReactNode): React.ReactElement {

    const style: React.CSSProperties = {
        height: "100%",
        overflowY: "auto",
        backgroundColor: "white"
    }
    return <Sider width={"80%"} children={el} style={style} />

}

export default function ListMasterDetailFormLayout({ children, pageTitle, handleAddNew }: PageLayoutProps): React.ReactElement {

    const childrenComponents = React.Children.toArray(children)
    const headerStyles: React.CSSProperties = {
        width: "100%",
        height: "10%",
        backgroundColor: "#d4eeff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    }

    return (
        <Layout style={{ height: "100%" }}>

            <Header style={headerStyles}>
                <Title level={3}>{pageTitle}</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
                    Add New
                </Button>
            </Header>

            <Layout style={{ width: "100%", height: "80%" }}>
                {childrenComponents[0]}
                {childrenComponents.length < 2 ? null : renderRightPanel(childrenComponents[1])}
            </Layout>

        </Layout>
    )
}
