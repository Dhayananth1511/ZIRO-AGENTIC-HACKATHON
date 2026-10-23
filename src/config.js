require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  BROWSERBASE_API_KEY: process.env.BROWSERBASE_API_KEY || '',
  BROWSERBASE_PROJECT_ID: process.env.BROWSERBASE_PROJECT_ID || '',
  REGION: process.env.BROWSERBASE_REGION || 'ap-southeast-1',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  TEAM_NAME: 'CodeCatalyst',
  AUTHOR_NAME: 'Dhayananth N',
  PROJECT_TITLE: 'AquaWard AI - Ward Water Quality Reporter'
};
