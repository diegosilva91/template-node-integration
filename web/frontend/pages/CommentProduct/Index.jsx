import React from "react";
import { Loading } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Frame,
  Card,
  Button
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

import { useAppQuery } from "../../hooks";
import { ProductListing } from "../../components/ProductListing.jsx";
function CommentProductsIndex() {
  let contentAll = undefined;

  const { t } = useTranslation();
  const {
    data,
    refetch: refetchProduct,
    isLoading: isLoadingData,
    isRefetching: isRefetching,
  } = useAppQuery({
    url: "/api/products/get",
    reactQueryOptions: {
      onSuccess: () => {
        //setIsLoading(false);
      },
    },
  });


  try {
    if (data) {
      contentAll = (
        <ProductListing data={data?.data} isLoading={isLoadingData}></ProductListing>
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
    <Page primaryAction={<Button onClick={() => refetchProduct()}>{t("CommentProduct.refreshButton")}</Button>} narrowWidth title={t("CommentProduct.titlePage")} backAction={{ content: t("CommentProduct.backIndex"), url: '/' }}>
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
    </Page>);
}

export default CommentProductsIndex;
