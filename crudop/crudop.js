require("dotenv").config();

const { Network, Alchemy } = require("alchemy-sdk");
const { createClient } = require("@supabase/supabase-js");
const jwt = require('jsonwebtoken');
const axios = require('axios')
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const alchemyApiKey = process.env.ALCHEMY_API_KEY;
const SECRET_KEY = process.env.SECRET_KEY


// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

const settings = {
  apiKey: alchemyApiKey,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);


const login = (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username and password are provided
        if (username && password) {
            // Perform authentication (replace with your own logic)
            if (username === 'meroku' && password === 'meroku@123') {
                // Generate JWT token
                const token = jwt.sign({ username: username }, SECRET_KEY, { expiresIn: '30m' });
                res.json({ token: token });
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        } else {
            res.status(400).json({ message: 'Invalid request format' });
        }
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
};


const fetch_report = async (req, res) => {
  try {
    const data1 = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      fromAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      category: ["external", "internal", "erc20", "erc721", "erc1155"],
    });

    if (!data1 || !data1.transfers || !Array.isArray(data1.transfers)) {
      throw new Error("Invalid transaction data received from Alchemy");
    }

    await Promise.all(
      data1.transfers.map(async (e) => {
        await supabase.from("transaction").insert([
          {
            block_number: e.blockNum,
            transaction_hash: e.hash,
            from_address: e.from,
            to_address: e.to,
            value: e.value,
            erc721_token_id: e.erc721TokenId,
            erc1155_metadata: e.erc1155Metadata,
            token_id: e.tokenId,
            asset: e.asset,
            category: e.category,
            raw_contract: e.rawContract,
          },
        ]);
      })
    );

    res
      .status(200)
      .json({ message: "Transaction data fetched and stored successfully" });
  } catch (error) {
    console.error(
      "Error fetching and storing transaction data:",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_report = async (req, res) => {
  try {
    const response = await axios.get(`${supabaseUrl}/rest/v1/transaction`, {
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = response.data;

    const { maxToValue, maxDateValue, maxValueTxnHash } = data.reduce(
      (result, item) => {
        const maxTransactionsAddress = item.to_address;
        const value = item.value;
        const maxTransactionsDate = item.timestamp;
        const hash = item.transaction_hash;

        result.occurrenceCount[maxTransactionsAddress] = (result.occurrenceCount[maxTransactionsAddress] || 0) + 1;
        if (result.occurrenceCount[maxTransactionsAddress] > result.maxOccurrence) {
          result.maxOccurrence = result.occurrenceCount[maxTransactionsAddress];
          result.maxToValue = maxTransactionsAddress;
        }

        result.occurrenceDateCount[maxTransactionsDate] = (result.occurrenceDateCount[maxTransactionsDate] || 0) + 1;
        if (result.occurrenceDateCount[maxTransactionsDate] > result.maxDateOccure) {
          result.maxDateOccure = result.occurrenceDateCount[maxTransactionsDate];
          result.maxDateValue = maxTransactionsDate;
        }

        if (value > result.maxValue) {
          result.maxValue = value;
          result.maxValueTxnHash = hash;
        }
        return result;
      },
      { occurrenceCount: {}, occurrenceDateCount: {}, maxOccurrence: 0, maxToValue: null,  maxValue: 0,  maxDateOccure:0 , maxDateValue:null, maxValueTxnHash:null }
    );

    const responseData = {
      "max_value_txn_hash": maxValueTxnHash,
      "max_txns_with_address": maxToValue,
      "date_max_txns": maxDateValue,
    };

    console.log(responseData);

    res.send(responseData);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = { fetch_report, get_report, login };
