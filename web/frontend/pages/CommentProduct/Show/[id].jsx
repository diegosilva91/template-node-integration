import {
    Page, Layout, Frame,
    Card,
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { useAppQuery } from "../../../hooks";
import { useParams } from 'react-router-dom';
import { Loading } from "@shopify/app-bridge-react";
import { ProductListing } from "../../../components/ProductListing.jsx";
function CommentProductsId() {
    const { t } = useTranslation();
    let contentAll = undefined;
    let { id } = useParams();
    const {
        data,
        refetch: refetchProduct,
        isLoading: isLoadingData,
        isRefetching: isRefetching,
    } = useAppQuery({
        url: `/api/products/get/${id}`,
        reactQueryOptions: {
            onSuccess: () => {
                //setIsLoading(false);
            },
        },
    });

    try {
        if (data) {
            contentAll = (
                <ProductListing data={data?.variants} isLoading={isLoadingData} type={'variant'}></ProductListing>
            );
            console.log(data);
        }
        else {
            return <Frame><Loading /></Frame>
        }
    } catch (e) {
        console.log(e)
    }

    return (
        <Page
            narrowWidth
            title={t("CommentProductId.titlePage")}
            backAction={{ content: t("CommentProduct.backIndex"), url: '/commentproduct' }}
        >
            <Layout>
                <Layout.Section>
                    <Card
                        title={t("ProductsCard.title")}
                        sectioned
                    >
                        {contentAll}
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default CommentProductsId;