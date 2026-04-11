import { Customer } from "@/lib/entities/Customer";
import { Button } from "@chakra-ui/react";
import { toaster } from "./base/Toaster";
import { Tooltip } from "./base/Tooltip";
import { IntuneLogo } from "./image/IntuneLogo";

interface Props {
    iconOnly?: boolean;
    customer?: Partial<Customer>;
    url: string;
}

export function OpenInIntuneButton({ iconOnly, customer, url }: Props) {
    if (!customer || !customer.tenant_id) {
        return null;
    }
    const intuneUrl = withTenantId(url, customer.tenant_id);
    const canOpen = Boolean(customer.supports_csp) === true;

    async function handleCopy(e: React.MouseEvent) {
        e.stopPropagation();
        await navigator.clipboard.writeText(intuneUrl);
        toaster.create({ type: "info", title: "Copied to clipboard" });
    }

    function withTenantId(url: string, tenantId: string) {
        const parsed = new URL(url);

        // Avoid double-inserting the tenant ID
        if (!parsed.pathname.startsWith(`/${tenantId}`)) {
            parsed.pathname = `/${tenantId}${parsed.pathname === "/" ? "" : parsed.pathname}`;
        }

        return parsed.toString();
    }

    if (iconOnly) {
        return (
            <Tooltip content={canOpen ? "Open in Intune" : "Copy link to Intune"}>
                <Button
                    size="sm"
                    variant="plain"
                    onClick={(e) => e.stopPropagation()}
                    asChild={canOpen}
                >
                    {canOpen ? (
                        <a href={intuneUrl} target="_blank" rel="noreferrer">
                            <IntuneLogo />
                        </a>
                    ) : (
                        <span onClick={handleCopy}>
                            <IntuneLogo />
                        </span>
                    )}
                </Button>
            </Tooltip>
        )
    }

    return (
        <Button
            size="sm"
            onClick={canOpen ? (e) => e.stopPropagation() : handleCopy}
            asChild={canOpen}
            height={8}
            marginBottom={4}
            bgColor="white"
            color="black"
            border="1px solid"
            borderColor="gray.200"
            _hover={{
                bgColor: "blue.50",
                transform: "scale(1.02)",
                borderColor: "gray.300"
            }}
        >
            {canOpen ? (
                <a href={intuneUrl} target="_blank" rel="noreferrer">
                    Open in Intune <IntuneLogo />
                </a>
            ) : (
                <>
                    Copy Link to Intune <IntuneLogo />
                </>
            )}
        </Button>
    )
}
