// App.tsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import _ from 'lodash';

const getTokenImg = (currency: string) => {
  return `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${currency}.svg`;
}

interface TokenPrice {
  currency: string;
  date: string;
  price: number;
}

function App() {
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenPrice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("from");
  const [balance, setBalance] = useState<{ [currency: string]: number }>({
    "ETH": 10,
  });
  const [errMsg, setErrMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("https://interview.switcheo.com/prices.json")
      .then((response) => response.json())
      .then((data: TokenPrice[]) => {
        // remove duplicate data row by key "currency"
        const uniqueCurrencies = Array.from(
          new Map(data.map(item => [item.currency, item])).values()
        );
        setTokenPrices(uniqueCurrencies);
        setFilteredTokens(uniqueCurrencies);
      })
      .catch((err) => console.error("Failed to load token prices", err));
  }, []);

  useEffect(() => {
    if (toCurrency) {
      const fromCurrencyPrice = tokenPrices.find(t => t.currency == fromCurrency)?.price
      const toCurrencyPrice = tokenPrices.find(t => t.currency == toCurrency)?.price
      const amount = (Number(fromCurrencyPrice) / Number(toCurrencyPrice)) * Number(fromAmount);
      setToAmount(amount?.toString());
    }
  }, [fromAmount, toCurrency])

  const openModal = (type: string) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTerm("");
    setFilteredTokens(tokenPrices);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const search = (term: string) => {
    const newTokenPrices = tokenPrices.filter((item) =>
      item.currency.toLowerCase().includes(term)
    )

    setFilteredTokens(newTokenPrices);
  }

  const debouncedSearch = _.debounce(search, 500);


  const selectToken = (currency: string) => {
    if (modalType === "from") {
      setFromCurrency(currency);
    } else {
      setToCurrency(currency);
    }
    closeModal();
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handlePercentSelect = (percent: number) => {
    const amount = percent / 100 * balance?.[fromCurrency];
    setFromAmount(amount?.toString());
  }

  const tokenIcons: { [currency: string]: string } = useMemo(() => tokenPrices?.reduce((prev, cur) => {
    if (!prev) return { [cur.currency]: getTokenImg(cur.currency) }
    return {
      ...prev,
      [cur.currency]: getTokenImg(cur.currency)
    }
  }, {}), [tokenPrices])

  useEffect(() => {
    if (fromCurrency) {
      if (Number(fromAmount) > (balance?.[fromCurrency] || 0)) {
        setErrMsg('Insufficient balance');
      } else {
        setErrMsg('');
      }
    }
  }, [fromAmount, balance, fromCurrency])

  const validate = () => {
    if (!fromCurrency || !toCurrency) {
      setErrMsg('Select token to swap');
      return false;
    }

    if (!fromAmount || isNaN(Number(fromAmount)) || Number(fromAmount) == 0) {
      setErrMsg('Select value to swap');
      return false;
    }

    return true;
  }

  const fetchSwap = async () => {
    setLoading(true);
    // call api here
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }

  const onSwap = () => {
    if (validate() && !errMsg) {
      fetchSwap();
    }
  }

  return (
    <div className="app-container">
      <h1 className="title">Token Swap</h1>
      <div className="swap-box">

        {/* From Section */}
        <div className="swap-col">
          <span className="label">From</span>
          <div className="swap-row">
            <div className="amount-input">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
              />
            </div>
            <div className="token-select" onClick={() => openModal("from")}>
              {(fromCurrency && (
                <>
                  <img src={tokenIcons[fromCurrency]} />
                  <div>{fromCurrency}</div>
                </>
              )) || "Select a token"}
            </div>
          </div>

          <div className="balance-container">
            <div className="balance" onClick={() => setFromAmount(balance?.[fromCurrency]?.toString() || '')}>
              <i className="material-icons">account_balance_wallet</i>
              <div>{balance?.[fromCurrency] || 0}</div>
              <div>{fromCurrency}</div>
            </div>
          </div>

          <div className="amount-row">
            <div className="percentage-buttons">
              {[25, 50, 75, 100].map((p) => (
                <button key={p} onClick={() => handlePercentSelect(p)}>{p}%</button>
              ))}
            </div>
          </div>
        </div>

        {/* Swap Icon */}
        <div className="swap-divider" onClick={swapCurrencies}>↕</div>

        {/* To Section */}
        <div className="swap-col">
          <span className="label">To</span>
          <div className="swap-row">

            <div className="amount-input">
              <input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
              />
            </div>
            <div className="token-select" onClick={() => openModal("to")}>
              {(toCurrency && (
                <>
                  <img src={tokenIcons[toCurrency]} />
                  <div>{toCurrency}</div>
                </>
              )) || "Select a token"}
            </div>
          </div>
        </div>

        {errMsg ? (
          <div className="errMsg">{errMsg}</div>
        ) : null}

        <button className="swap-button" onClick={onSwap}>
          {loading ? <div className="spinner"></div> : 'Swap'}
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="search-input"
              placeholder="Search token"
              value={searchTerm}
              onChange={handleSearch}
            />
            <div className="token-list">
              {filteredTokens.map((item) => (
                <div
                  key={item.currency + Date.now()}
                  className="token-item"
                  onClick={() => selectToken(item.currency)}
                >
                  <img
                    src={tokenIcons?.[item.currency] || "https://placehold.co/24x24"}
                    alt={item.currency}
                    className="token-icon"
                  />
                  <span>{item.currency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
