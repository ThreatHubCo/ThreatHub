import { PropsWithChildren } from "react";
import { WhiteBox } from "../box/WhiteBox";

export enum TableState {
    LOADING,
    FAILED,
    LOADED
}

interface Props {
    state: TableState;
    error?: string;
}

export function TableStateWrapper({ state, error, children }: PropsWithChildren<Props>) {
    if (state === TableState.FAILED) {
        return (
            <WhiteBox color="red.700">
                {error ? error : "Failed to load data, see browser console or network tab"}
            </WhiteBox>
        )
    }
    return children;
}