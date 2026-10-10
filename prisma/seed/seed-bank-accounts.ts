import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ACCOUNTS = [
  { bankName: "PRIME BANK LTD PLC",           branchName: "ISLAMI BANKING (MIRPUR)",  accountName: "Mariners Foodology And Agro Limited",          accountNumber: "3133131043165" },
  { bankName: "UNITED COMMERCIAL BANK LTD PLC", branchName: "ESKATON",                accountName: "MOHS Unity Venture Limited",                   accountNumber: "7862141005310248" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "MOHAKHALI",               accountName: "MOHS ECO Developments PLC",                    accountNumber: "1141100563588" },
  { bankName: "UNITED COMMERCIAL BANK LTD PLC", branchName: "ESKATON",                accountName: "MOHS ECO Developments PLC",                    accountNumber: "7862141005015204" },
  { bankName: "BRAC BANK LTD PLC",             branchName: "Mohakhali",               accountName: "MG Ventures PLC",                              accountNumber: "2079624620001" },
  { bankName: "PRIME BANK LTD PLC",            branchName: "MOHAKHALI",               accountName: "MG Ventures PLC",                              accountNumber: "3133132046992" },
  { bankName: "ISLAMI BANK BANGLADESH LTD PLC", branchName: "MOHAKHALI",              accountName: "MG Ventures PLC",                              accountNumber: "20501910100371009" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "MOHAKHALI",               accountName: "MG Ventures PLC",                              accountNumber: "1141200049009" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "MOHAKHALI",               accountName: "MG Ventures PLC",                              accountNumber: "1141100508628" },
  { bankName: "PRIME BANK LTD PLC",            branchName: "MOHAKHALI",               accountName: "MARINES BAKERS AND BEVERAGES LTD",             accountNumber: "2110118026072" },
  { bankName: "BRAC BANK LTD PLC",             branchName: "Mohakhali",               accountName: "Marines Bakers and Beverage Ltd",              accountNumber: "2078831880001" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "MOHAKHALI",               accountName: "MARINES BAKERS AND BEVERAGES LTD",             accountNumber: "1141100438500" },
  { bankName: "ISLAMI BANK BANGLADESH LTD PLC", branchName: "MOGHBAZAR",              accountName: "Merchant Feed Industries Limited",             accountNumber: "20503320100203303" },
  { bankName: "PRIME BANK LTD PLC",            branchName: "IBB DILKUSHA",            accountName: "MOHS ECO Developments PLC",                    accountNumber: "3108131049501" },
  { bankName: "PRIME BANK LTD PLC",            branchName: "IBB DILKUSHA",            accountName: "MS Marine Officers Business Club",             accountNumber: "3108138047250" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "SIRAJGANJ",               accountName: "MARINES BAKERS AND BEVERAGES LTD",             accountNumber: "2321100409685" },
  { bankName: "UNITED COMMERCIAL BANK LTD PLC", branchName: "ESKATON",                accountName: "MARINES BAKERS AND BEVERAGES LTD",             accountNumber: "7862141000041706" },
  { bankName: "BRAC BANK LTD PLC",             branchName: "MOGHBAZAR",               accountName: "Mariners Oceanic Housing Settlement Limited",  accountNumber: "2072441840001" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "MARINERS BAKERS AND BEVERAGES LTD",            accountNumber: "9923" },
  { bankName: "PRIME BANK LTD PLC",            branchName: "IBB DILKUSHA",            accountName: "Mariners Cosmetics and Toiletries Ltd",        accountNumber: "3108131047118" },
  { bankName: "PRIME BANK LTD PLC",            branchName: "IBB DILKUSHA",            accountName: "Mariners Bakers and Beverages Ltd",            accountNumber: "3108139047036" },
  { bankName: "BANK ASIA LTD PLC",             branchName: "PALTAN",                  accountName: "Mariners Food & Agro Limited",                 accountNumber: "04933002175" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "KASHINATHPUR",            accountName: "Mariners Food & Agro Limited - Peanut",        accountNumber: "2331100024678" },
  { bankName: "PRIME BANK LTD PLC",            branchName: "NEW ESKATON",             accountName: "Marinozz PLC",                                 accountNumber: "3108137046527" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "Marimax Trading International",                accountNumber: "2861100008395" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "Mariners Cosmetics and Toiletries Ltd",        accountNumber: "2861100198707" },
  { bankName: "PRIME BANK LTD PLC",            branchName: "NEW ESKATON",             accountName: "BLUEWAVE MEDIA & PRESS LIMITED",               accountNumber: "3108132034494" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "KASHINATHPUR",            accountName: "MARINES BAKERS AND BEVERAGES LTD",             accountNumber: "2331100320838" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "MARINERS FOOD AND AGRO LIMITED",               accountNumber: "2861100008475" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "KASHINATHPUR",            accountName: "MARINERS FOOD AND AGRO LIMITED",               accountNumber: "2331100024272" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "MARINES BAKERS AND BEVERAGES LTD",             accountNumber: "2861100007805" },
  { bankName: "ISLAMI BANK BANGLADESH LTD PLC", branchName: "MOGHBAZAR",              accountName: "MARINERS BAKERS AND BEVERAGES LTD",            accountNumber: "20503320100198701" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "MARINES BAKERS AND BEVERAGES LTD",             accountNumber: "2861200015657" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "BLUEWAVE MEDIA & PRESS LIMITED",               accountNumber: "2861100028682" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "MARINERS OCEANIC HOUSING SETTLEMENT LIMITED",  accountNumber: "2861100088709" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "MERCHANT FEED INDUSTRIES LIMITED",             accountNumber: "2861100073676" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "Moghbazar",               accountName: "MARINERS FOOD & AGRO LIMITED",                 accountNumber: "2861200000492" },
  { bankName: "ISLAMI BANK BANGLADESH LTD PLC", branchName: "MOUCHAK MARKET",         accountName: "MARINERS FOOD & AGRO LTD",                     accountNumber: "20501450100552413" },
  { bankName: "DUTCH-BANGLA BANK LTD PLC",     branchName: "KASHINATHPUR",            accountName: "MARINERS FOOD & AGRO LIMITED",                 accountNumber: "2331100024316" },
  { bankName: "UNITED COMMERCIAL BANK LTD PLC", branchName: "KASHINATHPUR",           accountName: "MARINERS FOOD & AGRO LIMITED",                 accountNumber: "1872101000001011" },
];

async function main() {
  console.log("Clearing existing bank accounts...");
  await db.bankAccount.deleteMany({});

  console.log(`Seeding ${ACCOUNTS.length} bank accounts...`);
  const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

  for (let i = 0; i < ACCOUNTS.length; i++) {
    const acc = ACCOUNTS[i];
    await db.bankAccount.create({
      data: {
        bankName:      acc.bankName,
        branchName:    acc.branchName,
        accountName:   acc.accountName,
        accountNumber: acc.accountNumber,
        isActive:      true,
        isDefault:     false,
        displayOrder:  i + 1,
        createdBy:     SYSTEM_USER_ID,
      },
    });
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => db.$disconnect());
