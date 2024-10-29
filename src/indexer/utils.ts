export function generateTransferID(
  depositNonce: string,
  fromDomainID: string,
  toDomainID: string,
): string {
  return depositNonce + "-" + fromDomainID + "-" + toDomainID;
}
