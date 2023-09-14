import { LegacyCard, Layout, Icon, Text } from "@shopify/polaris";
import { ProductsMajor } from "@shopify/polaris-icons"
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
export const Products = () => {
  const { t } = useTranslation();
  return (

    <Layout.Section fullWidth>
      <LegacyCard
        title="Products Comments"
        sectioned
        primaryFooterAction={{
          content: "Products Comments",
          onAction: () => {
            navigate("/commentproduct");
          },
        }}
      >
        <LegacyCard.Section
          title={
            <LegacyCard.Section>
              <Icon source={ProductsMajor} />
              <Text variant="headingXs" as="h3">
                {t("Products.titleIndex")}
              </Text>
            </LegacyCard.Section>
          }
        ></LegacyCard.Section>
      </LegacyCard>
    </Layout.Section>

  );
};
