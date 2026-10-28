import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { getAuthOptions } from "../../pages/api/auth/[...nextauth]";

/**
 * Require authentication on a page, otherwise redirect to login.
 * 
 * @param gssp This function wraps the getServerSideProps function, so this parameter is that
 */
export function requireAuth(
    gssp?: GetServerSideProps
): GetServerSideProps {
    return async (context: GetServerSidePropsContext) => {
        try {
            const session = await getServerSession(context.req, context.res, await getAuthOptions());

            if (!session) {
                return {
                    redirect: {
                        destination: `/login?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
                        permanent: false
                    }
                }
            }

            if (gssp) {
                const result = await gssp(context);

                if ("props" in result) {
                    return {
                        ...result,
                        props: {
                            ...result.props,
                            session: JSON.parse(JSON.stringify(session))
                        }
                    }
                }

                return result;
            }

            return {
                props: {
                    session: JSON.parse(JSON.stringify(session))
                }
            }
        } catch (e) {
            console.error(e);

            return {
                props: {
                    error: e.message ?? "An unknown error has occurred"
                }
            }
        }
    }
}