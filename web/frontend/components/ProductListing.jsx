import {
    ResourceList,
    Text, ResourceItem,
    Avatar,
    Icon
} from "@shopify/polaris";
import { TickMinor, CancelMinor } from "@shopify/polaris-icons"
import { useTranslation } from "react-i18next";
export const ProductListing = ({ data, isLoading }) => {
    const { t } = useTranslation();
    console.log(data)
    if (data === undefined) return <></>;
    const contentList = (
        <ResourceList filterControl={null} resourceName={{ singular: t('CommentProduct.product'), plural: t('CommentProduct.products') }}
            items={data}
            totalItemsCount={data?.length ?? 0}
            renderItem={(item, index) => {
                const { title, id, image, status, variants } = item;
                const media = image?.src ?
                    <Avatar source={image?.src} customer size="medium" name={title}></Avatar> :
                    <Avatar customer size="medium" name={title}></Avatar>;
                const shortCutActions = variants?.length > 0 ? (
                    [{ content: t('ProductListing.showVariants'), accessibilityLabel: t('ProductListing.viewVarianLabel'), url: `/commentproduct/show/${id}` }]
                ) : undefined
                    ;
                return (
                    <ResourceItem key={id + index} media={media}
                        shortcutActions={shortCutActions}
                        persistActions
                        accessibilityLabel={`View details for ${title}`}>
                        <Text variant="bodyMd" fontWeight="bold" as="h3">{title}</Text>
                        {status ? <Icon source={TickMinor} color="base" /> : <Icon source={CancelMinor} color="base" />}
                    </ResourceItem>
                )
            }}
            isLoading={isLoading}
        />
    );
    console.log(data);

    return contentList;
}
