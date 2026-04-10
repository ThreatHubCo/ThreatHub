import { Customer } from "@/lib/entities/Customer";
import { toaster } from "./base/Toaster";
import { Tooltip } from "./base/Tooltip";
import { Button } from "@chakra-ui/react";
import { DefenderLogo } from "./image/DefenderLogo";

interface Props {
    iconOnly?: boolean;
    customer?: Partial<Customer>;
    url: string;
}

export function OpenInDefenderButton({ iconOnly, customer, url }: Props) {
    if (!customer || !customer.tenant_id) {
        return null;
    }
    const defenderUrl = url.includes("?") ? `${url}&tid=${customer.tenant_id}` : `${url}?tid=${customer.tenant_id}`;
    const canOpen = Boolean(customer.supports_csp) === true;

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(defenderUrl);
        toaster.create({ type: "info", title: "Copied to clipboard" });
    }

    if (iconOnly) {
        return (
            <Tooltip content={canOpen ? "Open in Defender" : "Copy link to Defender"}>
                <Button
                    size="sm"
                    variant="plain"
                    onClick={(e) => e.stopPropagation()}
                    asChild={canOpen}
                >
                    {canOpen ? (
                        <a href={defenderUrl} target="_blank" rel="noreferrer">
                            <DefenderLogo />
                        </a>
                    ) : (
                        <span onClick={handleCopy}>
                            <DefenderLogo />
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
            variant="outline"
            colorPalette="brand.dark"
            borderColor="gray.200"
        >
            {canOpen ? (
                <a href={defenderUrl} target="_blank" rel="noreferrer">
                    Open in Defender <DefenderLogo />
                </a>
            ) : (
                <>
                    Copy Link to Defender <DefenderLogo />
                </>
            )}
        </Button>
    )
}
