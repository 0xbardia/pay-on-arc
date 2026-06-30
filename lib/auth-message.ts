type WalletLoginMessageInput = {
  address: string;
  nonce: string;
  domain: string;
  issuedAt: string;
  chainId?: number | null;
};

export function buildWalletLoginMessage({ address, nonce, domain, issuedAt, chainId }: WalletLoginMessageInput) {
  return [
    "Pay On Arc wallet login",
    "",
    "Sign this message to authenticate your wallet session.",
    "",
    `Domain: ${domain}`,
    `Address: ${address.toLowerCase()}`,
    `Chain ID: ${chainId ?? "unknown"}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}
