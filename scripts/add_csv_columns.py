#!/usr/bin/env python3
"""
Add application_link and bank_rules columns to cards.csv.
Bank rules from r/churning flowchart (5/24, Amex one-per-lifetime, Citi 24mo, etc.)
"""

import csv

# Application URLs by card name (official issuer URLs - user should verify)
APPLICATION_LINKS = {
    "Chase Freedom Unlimited": "https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited",
    "Chase Freedom Flex": "https://creditcards.chase.com/cash-back-credit-cards/freedom/flex",
    "Chase Amazon Prime Visa": "https://creditcards.chase.com/cash-back-credit-cards/amazon/prime",
    "Chase Freedom Rise": "https://creditcards.chase.com/cash-back-credit-cards/freedom/rise",
    "Chase Sapphire Preferred": "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred",
    "Chase Sapphire Reserve": "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve",
    "Chase Ink Cash": "https://creditcards.chase.com/business-credit-cards/ink/cash",
    "Chase Ink Unlimited": "https://creditcards.chase.com/business-credit-cards/ink/unlimited",
    "United Gateway Card": "https://creditcards.chase.com/travel-credit-cards/united/gateway",
    "United Club Infinite Card": "https://creditcards.chase.com/travel-credit-cards/united/united-club-infinite",
    "Southwest Rapid Rewards Priority": "https://creditcards.chase.com/travel-credit-cards/southwest/priority",
    "Southwest Rapid Rewards Premier": "https://creditcards.chase.com/travel-credit-cards/southwest/premier",
    "Marriott Bonvoy Bountiful": "https://creditcards.chase.com/marriott/apply",
    "IHG One Rewards Premier": "https://creditcards.chase.com/travel-credit-cards/ihg/rewards-premier",
    "IHG One Rewards Traveler": "https://creditcards.chase.com/travel-credit-cards/ihg/rewards-traveler",
    "Chase Sapphire Reserve for Business": "https://creditcards.chase.com/business-credit-cards/sapphire/reserve",
    "Ink Business Preferred Credit Card": "https://creditcards.chase.com/business-credit-cards/ink/preferred",
    "Ink Business Premier Credit Card": "https://creditcards.chase.com/business-credit-cards/ink/premier",
    "United Business Card": "https://creditcards.chase.com/business-credit-cards/united/business",
    "United Club Business Card": "https://creditcards.chase.com/business-credit-cards/united/club-business",
    "Southwest Rapid Rewards Performance Business": "https://creditcards.chase.com/business-credit-cards/southwest/performance-business",
    "Southwest Rapid Rewards Premier Business": "https://creditcards.chase.com/business-credit-cards/southwest/premier-business",
    "IHG One Rewards Premier Business": "https://creditcards.chase.com/business-credit-cards/ihg/rewards-premier-business",
    "World of Hyatt Business Credit Card": "https://creditcards.chase.com/business-credit-cards/hyatt/business",
    "Citi Double Cash": "https://www.citi.com/credit-cards/citi-double-cash-credit-card",
    "Citi Custom Cash": "https://www.citi.com/credit-cards/citi-custom-cash-credit-card",
    "Citi Strata Premier": "https://www.citi.com/credit-cards/citi-strata-premier-credit-card",
    "Citi AAdvantage Platinum Select World Elite Mastercard": "https://www.citi.com/credit-cards/citi-aadvantage-platinum-select-world-elite-mastercard",
    "Citi AAdvantage Globe Mastercard": "https://www.citi.com/credit-cards/citi-aadvantage-globe-mastercard",
    "Citi AAdvantage Executive World Elite Mastercard": "https://www.citi.com/credit-cards/citi-aadvantage-executive-world-elite-mastercard",
    "Citi Strata Elite Credit Card": "https://www.citi.com/credit-cards/citi-strata-elite-credit-card",
    "Citi Strata Credit Card": "https://www.citi.com/credit-cards/citi-strata-credit-card",
    "Citi Diamond Preferred Credit Card": "https://www.citi.com/credit-cards/citi-diamond-preferred-credit-card",
    "Citi Simplicity Credit Card": "https://www.citi.com/credit-cards/citi-simplicity-credit-card",
    "Citi AAdvantage MileUp Card": "https://www.citi.com/credit-cards/citi-aadvantage-mileup-card",
    "Citi Secured Mastercard": "https://www.citi.com/credit-cards/citi-secured-credit-card",
    "Costco Anywhere Visa Business Card by Citi": "https://www.citi.com/credit-cards/costco-anywhere-visa-business-card-by-citi",
    "Citi AAdvantage Business World Elite Mastercard": "https://www.citi.com/credit-cards/citi-aadvantage-business-world-elite-mastercard",
    "Capital One Quicksilver": "https://www.capitalone.com/credit-cards/quicksilver/",
    "Capital One SavorOne": "https://www.capitalone.com/credit-cards/savorone/",
    "Capital One Venture": "https://www.capitalone.com/credit-cards/venture/",
    "Capital One Venture X": "https://www.capitalone.com/credit-cards/venture-x/",
    "Capital One Platinum": "https://www.capitalone.com/credit-cards/platinum/",
    "Capital One Spark Cash": "https://www.capitalone.com/small-business/credit-cards/spark-cash/",
    "Capital One Spark Cash Plus": "https://www.capitalone.com/small-business/credit-cards/spark-cash-plus/",
    "Capital One Spark Cash Select": "https://www.capitalone.com/small-business/credit-cards/spark-cash-select/",
    "Capital One Venture X Business": "https://www.capitalone.com/small-business/credit-cards/venture-x-business/",
    "Capital One Spark Miles": "https://www.capitalone.com/small-business/credit-cards/spark-miles/",
    "Bank of America Customized Cash": "https://www.bankofamerica.com/credit-cards/products/cash-rewards-credit-card/",
    "Bank of America Unlimited Cash": "https://www.bankofamerica.com/credit-cards/products/unlimited-cash-rewards-credit-card/",
    "BankAmericard Cash Rewards": "https://www.bankofamerica.com/credit-cards/products/bankamericard-cash-rewards-credit-card/",
    "Bank of America Travel Rewards": "https://www.bankofamerica.com/credit-cards/products/travel-rewards-credit-card/",
    "Bank of America Premium Rewards": "https://www.bankofamerica.com/credit-cards/products/premium-rewards-credit-card/",
    "Bank of America Business Advantage Travel Rewards": "https://www.bankofamerica.com/smallbusiness/credit-cards/products/business-advantage-travel-rewards-world-mastercard/",
    "Bank of America Business Advantage Atmos Rewards": "https://www.bankofamerica.com/smallbusiness/credit-cards/products/business-advantage-customized-cash-rewards/",
    "Bank of America Business Advantage Customized Cash Rewards": "https://www.bankofamerica.com/smallbusiness/credit-cards/products/business-advantage-customized-cash-rewards/",
    "Alaska Airlines Visa Signature": "https://www.bankofamerica.com/credit-cards/products/alaska-airlines-visa-signature-credit-card/",
    "Atmos Rewards Summit Visa Infinite": "https://www.bankofamerica.com/credit-cards/products/alaska-airlines-visa-signature-credit-card/",
    "U.S. Bank Cash+": "https://www.usbank.com/credit-cards/cash-plus-visa-signature-credit-card.html",
    "U.S. Bank Unlimited Cash": "https://www.usbank.com/credit-cards/unlimited-cash-rewards-credit-card.html",
    "Amex Blue Cash Everyday": "https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/",
    "Amex Blue Cash Preferred": "https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/",
    "Amex Green": "https://www.americanexpress.com/us/credit-cards/card/green/",
    "Amex Gold": "https://www.americanexpress.com/us/credit-cards/card/gold-card/",
    "Amex Platinum": "https://www.americanexpress.com/us/credit-cards/card/platinum/",
    "Barclays JetBlue Premier": "https://cards.barclaycardus.com/banking/cards/jetblue-premier-card/",
    "Barclays JetBlue Plus": "https://cards.barclaycardus.com/banking/cards/jetblue-plus-card/",
    "Barclays Frontier Airlines World Mastercard": "https://cards.barclaycardus.com/banking/cards/frontier-airlines-world-mastercard/",
    "Barclays JetBlue Business Card": "https://cards.barclaycardus.com/banking/cards/jetblue-business-card/",
    "Marriott Bonvoy Bevy American Express Card": "https://www.americanexpress.com/us/credit-cards/card/marriott-bonvoy-bevy/",
    "Hilton Honors American Express Aspire Card": "https://www.americanexpress.com/us/credit-cards/card/hilton-aspire/",
    "American Express Green Card": "https://www.americanexpress.com/us/credit-cards/card/green/",
    "Delta SkyMiles Gold American Express Card": "https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-gold/",
    "Hilton Honors American Express Surpass Card": "https://www.americanexpress.com/us/credit-cards/card/hilton-surpass/",
    "Marriott Bonvoy Brilliant American Express Card": "https://www.americanexpress.com/us/credit-cards/card/marriott-bonvoy-brilliant/",
    "Delta SkyMiles Platinum American Express Card": "https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-platinum/",
    "Hilton Honors American Express Business Card": "https://www.americanexpress.com/us/credit-cards/card/hilton-honors-business/",
    "Marriott Bonvoy Business American Express Card": "https://www.americanexpress.com/us/credit-cards/card/marriott-bonvoy-business/",
    "Delta SkyMiles Gold Business American Express Card": "https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-gold-business/",
    "Delta SkyMiles Platinum Business American Express Card": "https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-platinum-business/",
    "The Business Platinum Card from American Express": "https://www.americanexpress.com/us/credit-cards/card/platinum-business/",
    "Blue Business Plus Credit Card from American Express": "https://www.americanexpress.com/us/credit-cards/card/blue-business-plus/",
}

# Bank rules from flowchart - key rules by issuer/card family
def get_bank_rules(card_name: str, issuer: str, card_type: str, card_family: str) -> str:
    rules = []
    
    # General rules (all banks)
    rules.append("1 new card per 90 days (general). Wait for bonus to post before closing.")
    
    if issuer == "Chase":
        if card_type == "personal":
            rules.append("Counts toward 5/24 (Chase won't approve if 5+ personal cards in 24mo).")
        else:
            rules.append("Ink/Chase business cards typically don't report to personal credit; don't count 5/24.")
        if "Sapphire" in card_name:
            rules.append("Sapphire: Can't hold another Sapphire. 48mo since last Sapphire bonus.")
        if "Marriott" in card_name:
            rules.append("Marriott: Complex family rules; 12mo between some Marriott cards.")
        rules.append("Strong credit score, low utilization, on-time payments help approval.")
        
    elif issuer == "Amex":
        rules.append("1 card per 5 days; max 2 cards per 90 days.")
        rules.append("Platinum/Gold/Green/EveryDay: One bonus per lifetime per card (family rule since Feb 2020).")
        if card_type == "business":
            rules.append("Amex business cards: No family rules; bonus eligible even if had personal version.")
        rules.append("Personal + business can be applied same day.")
        rules.append("Soft pull possible if existing Amex customer.")
        
    elif issuer == "Citi":
        rules.append("ThankYou (Strata) cards: 24mo between opening TYP cards.")
        rules.append("48mo bonus rule on many Citi cards (check product).")
        
    elif issuer == "Capital One":
        rules.append("Venture X: May get soft pull (no hard pull) if existing Capital One customer.")
        rules.append("Generally 1 card per 90 days.")
        
    elif issuer == "Bank of America":
        rules.append("2/3/4 rule: 2 cards per 2mo, 3 per 12mo, 4 per 24mo.")
        
    elif issuer == "U.S. Bank":
        rules.append("1/24 for some products (1 card per 24 months).")
        rules.append("1 new card per 90 days generally.")
        
    elif issuer == "Barclays":
        rules.append("Generally 1 card per 90 days.")
    
    return " | ".join(rules)


def main():
    input_path = "public/cards.csv"
    output_path = "public/cards.csv"
    
    rows = []
    with open(input_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        
        # Add application_link before bank_rules if not present
        if "application_link" not in fieldnames:
            idx = fieldnames.index("bank_rules") if "bank_rules" in fieldnames else len(fieldnames)
            fieldnames.insert(idx, "application_link")
        
        for row in reader:
            card_name = row.get("card_name", "")
            issuer = row.get("issuer", "")
            card_type = row.get("card_type", "")
            card_family = row.get("card_family", "").strip()
            
            # Get application link
            link = APPLICATION_LINKS.get(card_name, "")
            if not link:
                # Fallback to issuer homepage
                fallbacks = {
                    "Chase": "https://creditcards.chase.com/",
                    "Citi": "https://www.citi.com/credit-cards/",
                    "Capital One": "https://www.capitalone.com/credit-cards/",
                    "Bank of America": "https://www.bankofamerica.com/credit-cards/",
                    "U.S. Bank": "https://www.usbank.com/credit-cards.html",
                    "Amex": "https://www.americanexpress.com/us/credit-cards/",
                    "Barclays": "https://cards.barclaycardus.com/",
                }
                link = fallbacks.get(issuer, "")
            
            row["application_link"] = link
            row["bank_rules"] = get_bank_rules(card_name, issuer, card_type, card_family)
            rows.append(row)
    
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"Updated {len(rows)} rows. Added application_link and bank_rules.")


if __name__ == "__main__":
    main()
