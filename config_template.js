export let config = {
  discord: {
    clientId: "changeme",
    clientSecret: "changeme",
    redirectUri: "http://localhost:8080/auth/discord/callback"
  },
  steam: {
    realm: "http://localhost:8080/",
    apiKey: "changeme",
    redirectUri: "http://localhost:8080/auth/steam/callback"
  }
}