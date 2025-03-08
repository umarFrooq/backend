
exports = async function(changeEvent) {
    console.log("Event triggered");
    const { operationType, fullDocument } = changeEvent;
    let doc = fullDocument;
    let dataBase = context.services
         .get("mysouq-stage")
           .db("mysouq-stage");
    
  
    console.log("Change event received:", operationType);
    console.log("Change event data:", JSON.stringify(changeEvent, null, 2));
    const priceParser = async () => {
      let basePrices = {
        PAK_FOREX: 0,
        PAK_VAT: 0,
        PAK_SHIPPMENT: 0,
        PAK_PREMIUM: 0,
        CHINA_PREMIUM: 0,
        CHINA_FOREX: 0,
        CHINA_VAT: 0,
        CHINA_SHIPMENT: 0,
        KSA_SHIPMENT: 0,
        KSA_FOREX: 0,
        KSA_PREMIUM: 0,
        KSA_VAT: 0
      };
      // Fetch settings from the database
      const settings = await dataBase.collection("settings").find({
        key: { $in: Object.keys(basePrices) }
      }).toArray();
    
      // Initialize base prices object
   
    
      // Helper function to parse data based on its type
      
    
    
      // Process each setting and update basePrices
       settings.forEach(val => {
        basePrices[val.key] = Number(val.keyValue); 
      });
    
      // Map basePrices to a more readable format
       basePrices = {
        pakPremium: basePrices["PAK_PREMIUM"]||0,
        pakShipment: basePrices["PAK_SHIPPMENT"]||0,
        pakForex: basePrices["PAK_FOREX"]||0,
        pakVat: basePrices["PAK_VAT"]||0,
        chinaPremium: basePrices["CHINA_PREMIUM"]||0,
        chinaShipment: basePrices["CHINA_SHIPMENT"]||0,
        chinaForex: basePrices["CHINA_FOREX"]||0,
        chinaVat: basePrices["CHINA_VAT"]||0,
        ksaPremium: basePrices["KSA_PREMIUM"]||0,
        ksaShipment: basePrices["KSA_SHIPMENT"]||0,
        ksaForex: basePrices["KSA_FOREX"]||0,
        ksaVat: basePrices["KSA_VAT"]||0
      };
    
      // Log final output for debugging
      console.log("Mapped Prices:", JSON.stringify(basePrices))
    
      return basePrices;
    };
  
    const runTimePriceUpdateQuery = (basePriceData) => {
      const decidePremium =()=> {
       return {$addFields: {
          premiumPercentage: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$origin", "pak"] },
                  then: {
                    $cond: {
                      if: { $eq: ["$sellerDetail.premium", true] },
                      then: "$sellerDetail.premiumPercentage",
                      else:  basePriceData.pakPremium,
    
                    }
                  }
                },
                {
                  case: { $eq: ["$origin", "ksa"] },
                  then: {
                    $cond: {
                      if: { $eq: ["$sellerDetail.premium", true] },
                      then: "$sellerDetail.premiumPercentage",
                      else: basePriceData.ksaPremium
                    }
                  }
                },
                {
                  case: { $eq: ["$origin", "china"] },
                  then: {
                    $cond: {
                      if: { $eq: ["$sellerDetail.premium", true] },
                      then: "$sellerDetail.premiumPercentage",
                      else: basePriceData.chinaPremium
                    }
                  }
                }
              ],
              default: 0
            }
          }
        }
      }
      };
    
      const calculatePrice = (priceField, forex, vat, shipment) => ({
        $add: [
          { $ifNull: [`$${priceField}`, 0] },
          { $multiply: [{ $ifNull: [`$${priceField}`, 0] }, { $divide: ["$premiumPercentage", 100] }] },
          { $multiply: [{ $ifNull: [`$${priceField}`, 0] }, { $divide: [forex, 100] }] },
          {
            $divide: [
              {
                $multiply: [
    
                  {
                    $add: [
                      { $multiply: [{ $ifNull: [`$${priceField}`, 0] }, { $divide: ["$premiumPercentage", 100] }] },
                      { $ifNull: [`$${priceField}`, 0] }
                    ]
                  },
                  vat
                ]
              },
              { $subtract: [100, vat] }
            ]
          },
          shipment
        ]
      });
    
      const query = [
        decidePremium(),
        {
          $addFields: {
            regularPrice: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$origin", "pak"] },
                    then: calculatePrice("regularPrice", basePriceData.pakForex, basePriceData.pakVat, basePriceData.pakShipment)
                  },
                  {
                    case: { $eq: ["$origin", "ksa"] },
                    then: calculatePrice("regularPrice", basePriceData.ksaForex, basePriceData.ksaVat, basePriceData.ksaShipment)
                  },
                  {
                    case: { $eq: ["$origin", "china"] },
                    then: calculatePrice("regularPrice", basePriceData.chinaForex, basePriceData.chinaVat, basePriceData.chinaShipment)
                  }
                ],
                default: { $ifNull: ["$regularPrice", 0] }
              }
            },
            salePrice: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$origin", "pak"] },
                    then: calculatePrice("salePrice",basePriceData.pakForex, basePriceData.pakVat, basePriceData.pakShipment)
                  },
                  {
                    case: { $eq: ["$origin", "ksa"] },
                    then: calculatePrice("salePrice", basePriceData.ksaForex, basePriceData.ksaVat, basePriceData.ksaShipment)
                  },
                  {
                    case: { $eq: ["$origin", "china"] },
                    then: calculatePrice("salePrice",basePriceData.chinaForex, basePriceData.chinaVat, basePriceData.chinaShipment)
                  }
                ],
                default: { $ifNull: ["$salePrice", 0] }
              }
            }
          }
        },
        {
          $addFields: {
            price: {
              $cond: {
                if: { $and: [{ $eq: ["$onSale", true] }, { $lt: ["$salePrice", "$regularPrice"] }] },
                then: "$salePrice",
                else: "$regularPrice"
              }
            }
          }
        },
        {
          $addFields: {
            regularPrice: { $round: ["$regularPrice", 2] },
            salePrice: { $round: ["$salePrice", 2] },
            price: { $round: ["$price", 2] }
          }
        }
      ];
    
      return query;
    };
  
    try {
      // Initialize the payload with sellerId and brandNameLang
      let payload = {
        sellerId: doc._id,
        brandNameLang: [`en.${doc.brandName}`], // Add default language brand name
        brandLang: true
      };
  
      // Extract language-specific brand names from the 'lang' object if available
      let brandLang = Object.keys(doc.lang || {});
  
      if (brandLang.length) {
        brandLang.forEach((language) => {
          const brandNameForLanguage = doc.lang?.[language]?.brandName;
          if (brandNameForLanguage) {
            payload.brandNameLang.push(`${language}.${brandNameForLanguage}`);
          } else {
            console.warn(`Brand name not found for language: ${language}`);
          }
        });
      }
  let basePrices=await priceParser()
  let priceQuery=runTimePriceUpdateQuery(basePrices)
  if(doc.premium)
  {
    basePrices.pakPremium=doc.premiumPercentage
    basePrices.ksaPremium=doc.premiumPercentage
  }
      // basePrices.premiumPercentage=basePrices.premiumPercentage+(basePrices.premiumPercentage*basePrices.vat/100)
      // Use aggregation to get products, categories, and users in one go
      const aggregatedData = await dataBase
        .collection("products")
        .aggregate([
          {
            $match: {
              sellerDetail: doc._id,
              productType: "main",
              active: true
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categoryDetails"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userDetails"
            }
          },
          {
            $unwind: "$categoryDetails"
          },
          {
            $unwind: "$userDetails"
          },
          {
            $addFields: {
              sellerDetail: doc, // Add full seller detail
              id: "$_id", // Assign _id to id
              brandNameLang: payload.brandNameLang // Assign brand name languages
            }
          },
    ...priceQuery
        ])
        .toArray();
  
      if (!aggregatedData.length) {
        console.log("No products found for sellerDetail:", doc._id);
        return;
      }
  
      // Batch size
      const batchSize = 500;
  
      // Split aggregatedData into batches of 500
      for (let i = 0; i < aggregatedData.length; i += batchSize) {
        const batch = aggregatedData.slice(i, i + batchSize);
  
        // Prepare batch payload
        let batchPayload = {
          ...payload,
          products: batch
        };
  
        // Make the POST request to the Lambda function for each batch
        try {
          const response = await context.http.post({
            url: "https://7alslq77t2bui4a6h7ud5omrl40zffkj.lambda-url.me-south-1.on.aws/",
            body: JSON.stringify({
              action: "update",
              payload: batchPayload
            }),
            headers: {
              "Content-Type": ["application/json"]
            }
          });
  
          // Check if the Lambda call was successful
          if (response.statusCode === 200) {
            console.log(`Lambda function called successfully for batch ${i / batchSize + 1}:`, JSON.stringify(response.body));
          } else {
            console.error(`Error calling Lambda for batch ${i / batchSize + 1}:`, response.statusCode, JSON.stringify(response.body));
          }
        } catch (error) {
          console.error(`Error during Lambda call for batch ${i / batchSize + 1}:`, error);
        }
      }
  
    } catch (error) {
      console.error("Error during aggregation or Lambda call:", error);
    }
  
  
  
  
  };
  
  