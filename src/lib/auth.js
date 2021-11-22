export const getAccessToken = (request) => {
  const authHeader = request.headers.authorization
  if (authHeader)
    return authHeader.split(" ")[1]
  return null
}