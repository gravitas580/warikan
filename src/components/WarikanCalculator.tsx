import React, { useState, useEffect } from 'react';

interface Person {
  name: string;
  amount: number;
  expression: string;
}

interface Result {
  average: number;
  differences: { name: string; difference: number }[];
  payments: { from: string; to: string; amount: number }[];
}

// UTF-8対応base64エンコード
function toBase64(str: string) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

// UTF-8対応base64デコード
function fromBase64(str: string) {
  return decodeURIComponent(escape(window.atob(str)));
}

const WarikanCalculator: React.FC = () => {
  const [participantCount, setParticipantCount] = useState<string>('');
  const [people, setPeople] = useState<Person[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleParticipantCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setParticipantCount(value);
    const count = Number(value);
    if (!value || count < 1) {
      setPeople([]);
      setResult(null);
      return;
    }
    const newPeople = Array.from({ length: count }, (_, i) => ({
      name: String.fromCharCode(65 + i) + 'さん',
      amount: 0,
      expression: ''
    }));
    setPeople(newPeople);
    setResult(null);
  };

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const newPeople = [...people];
    if (field === 'expression') {
      try {
        // 計算式を評価
        const amount = eval(value) || 0;
        newPeople[index] = {
          ...newPeople[index],
          expression: value,
          amount: amount
        };
      } catch (error) {
        // 計算式が無効な場合は式のみ更新
        newPeople[index] = {
          ...newPeople[index],
          expression: value
        };
      }
    } else {
      newPeople[index] = {
        ...newPeople[index],
        [field]: value
      };
    }
    setPeople(newPeople);
  };

  const calculatePayments = (differences: { name: string; difference: number }[]) => {
    const payments: { from: string; to: string; amount: number }[] = [];
    const creditors = differences.filter(d => d.difference > 0).sort((a, b) => b.difference - a.difference);
    const debtors = differences.filter(d => d.difference < 0).sort((a, b) => a.difference - b.difference);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const paymentAmount = Math.min(
        creditor.difference,
        Math.abs(debtor.difference)
      );

      if (paymentAmount > 0) {
        payments.push({
          from: debtor.name,
          to: creditor.name,
          amount: paymentAmount
        });

        creditor.difference -= paymentAmount;
        debtor.difference += paymentAmount;

        if (creditor.difference < 0.01) creditorIndex++;
        if (debtor.difference > -0.01) debtorIndex++;
      }
    }

    return payments;
  };

  const calculateWarikan = (targetPeople?: Person[]) => {
    const usePeople = targetPeople || people;
    const total = usePeople.reduce((sum, person) => sum + person.amount, 0);
    const average = total / usePeople.length;
    
    const differences = usePeople.map(person => ({
      name: person.name,
      difference: person.amount - average
    }));

    const payments = calculatePayments(differences);

    setResult({ average, differences, payments });

    // 計算ボタン押下時にURLを最新に更新
    if (people.length > 0) {
      const data = encodeURIComponent(toBase64(JSON.stringify({ people })));
      const url = new URL(window.location.href);
      url.searchParams.set('data', data);
      console.log('URL更新:', url.toString());
      window.history.replaceState(null, '', url.toString());
      setShareUrl(url.toString());
      setCopied(false);
    }
  };

  // URLから状態を復元（初回のみ）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
      try {
        const decoded = JSON.parse(fromBase64(decodeURIComponent(data)));
        if (Array.isArray(decoded.people)) {
          setPeople(decoded.people);
          setParticipantCount(decoded.people.length.toString());
          // 計算結果も自動で表示
          setTimeout(() => {
            calculateWarikan(decoded.people);
          }, 0);
        }
      } catch (e) {
        // 無視
      }
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="warikan-root">
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: 'clamp(20px, 5vw, 30px)',
        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        color: '#2c3e50',
        fontWeight: 'bold',
        letterSpacing: '0.05em'
      }}>
        割り勘計算
      </h1>
      <div className="warikan-main">
        <div className="warikan-card">
          <div style={{ 
            backgroundColor: 'white',
            padding: 'clamp(15px, 3vw, 20px)',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '10px'
            }}>
              <label style={{ 
                fontWeight: 'bold',
                fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                参加人数:
              </label>
              <input
                type="number"
                min="1"
                value={participantCount}
                onChange={handleParticipantCountChange}
                style={{ 
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem',
                  width: '100%',
                  maxWidth: '100%',
                  backgroundColor: '#f8f9fa',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {people.length > 0 && (
            <div className="warikan-card" style={{ marginTop: '2vw' }}>
              <h2 style={{ 
                marginBottom: 'clamp(15px, 3vw, 20px)',
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                color: '#2c3e50',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
              }}>
                支払い情報
              </h2>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'clamp(15px, 3vw, 20px)'
              }}>
                {people.map((person, index) => (
                  <div key={index} style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(10px, 2vw, 15px)',
                    padding: 'clamp(15px, 3vw, 20px)',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <label style={{ 
                        fontWeight: 'bold',
                        fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        名前:
                      </label>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                        style={{ 
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                          fontSize: '1rem',
                          width: '100%',
                          backgroundColor: 'white',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <label style={{ 
                        fontWeight: 'bold',
                        fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        支払額:
                      </label>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '5px'
                      }}>
                        <input
                          type="text"
                          value={person.expression}
                          onChange={(e) => handlePersonChange(index, 'expression', e.target.value)}
                          placeholder="例: 1000 + 500"
                          style={{ 
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                            fontSize: '1rem',
                            width: '100%',
                            backgroundColor: 'white',
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#666',
                          marginTop: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          計算結果: {person.amount}円
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => calculateWarikan()}
                style={{
                  marginTop: 'clamp(15px, 3vw, 20px)',
                  padding: '12px 24px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  width: '100%',
                  maxWidth: '300px',
                  margin: '20px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                計算する
              </button>
            </div>
          )}
        </div>

        {result && (
          <div className="warikan-card">
            <h2 style={{ 
              marginBottom: 'clamp(15px, 3vw, 20px)',
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              color: '#2c3e50',
              fontWeight: 'bold',
              letterSpacing: '0.05em'
            }}>
              計算結果
            </h2>
            <div style={{ 
              padding: 'clamp(15px, 3vw, 20px)',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              marginBottom: 'clamp(15px, 3vw, 20px)',
              border: '1px solid #e0e0e0'
            }}>
              <p style={{ 
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                marginBottom: '0',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                1人あたりの支払額: <span style={{ fontWeight: 'bold' }}>{result.average.toFixed(0)}円</span>
              </p>
            </div>

            <h3 style={{ 
              marginBottom: 'clamp(10px, 2vw, 15px)',
              fontSize: 'clamp(1.1rem, 2vw, 1.2rem)',
              color: '#2c3e50',
              fontWeight: 'bold',
              letterSpacing: '0.05em'
            }}>
              支払いの流れ
            </h3>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {result.payments.map((payment, index) => (
                <div key={index} style={{ 
                  padding: 'clamp(12px, 2vw, 15px)',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '1px solid #e0e0e0'
                }}>
                  <span style={{ color: '#f44336', fontWeight: 'bold' }}>{payment.from}</span>
                  <span style={{ color: '#666' }}>→</span>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{payment.to}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#2c3e50' }}>
                    {payment.amount.toFixed(0)}円
                  </span>
                </div>
              ))}
            </div>

            <h3 style={{ 
              marginTop: 'clamp(20px, 4vw, 30px)',
              marginBottom: 'clamp(10px, 2vw, 15px)',
              fontSize: 'clamp(1.1rem, 2vw, 1.2rem)',
              color: '#2c3e50',
              fontWeight: 'bold',
              letterSpacing: '0.05em'
            }}>
              各人の支払額の差分
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {result.differences.map((diff, index) => (
                <li key={index} style={{ 
                  padding: 'clamp(12px, 2vw, 15px)',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                  border: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {diff.name}: <span style={{ 
                    color: diff.difference > 0 ? '#4CAF50' : '#f44336',
                    fontWeight: 'bold',
                    marginLeft: 'auto'
                  }}>
                    {diff.difference > 0 ? '+' : ''}{diff.difference.toFixed(0)}円
                  </span>
                </li>
              ))}
            </ul>

            {shareUrl && (
              <div style={{ margin: '32px 0', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>計算結果をURLで共有できます！</div>
                <div style={{ wordBreak: 'break-all', background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8, padding: 8, marginBottom: 8 }}>{shareUrl}</div>
                <button
                  type="button"
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                  }}
                >
                  URLをコピー
                </button>
                {copied && <div style={{ color: '#4CAF50', marginTop: 8 }}>コピーしました！</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WarikanCalculator; 