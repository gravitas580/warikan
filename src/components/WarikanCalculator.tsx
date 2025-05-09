import React, { useState } from 'react';

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

const WarikanCalculator: React.FC = () => {
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [people, setPeople] = useState<Person[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const handleParticipantCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Number(e.target.value);
    setParticipantCount(count);
    
    const newPeople = Array.from({ length: count }, (_, i) => ({
      name: String.fromCharCode(65 + i),
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

  const calculateWarikan = () => {
    const total = people.reduce((sum, person) => sum + person.amount, 0);
    const average = total / people.length;
    
    const differences = people.map(person => ({
      name: person.name,
      difference: person.amount - average
    }));

    const payments = calculatePayments(differences);

    setResult({ average, differences, payments });
  };

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: 'clamp(10px, 5vw, 20px)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: 'clamp(20px, 5vw, 30px)',
        fontSize: 'clamp(1.5rem, 4vw, 2rem)'
      }}>割り勘計算</h1>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row',
        gap: 'clamp(15px, 3vw, 20px)',
        backgroundColor: '#f5f5f5',
        padding: 'clamp(15px, 3vw, 20px)',
        borderRadius: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          flex: '1 1 400px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(15px, 3vw, 20px)'
        }}>
          <div style={{ 
            backgroundColor: 'white',
            padding: 'clamp(15px, 3vw, 20px)',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '10px'
            }}>
              <label style={{ 
                fontWeight: 'bold',
                fontSize: 'clamp(1rem, 2vw, 1.1rem)'
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
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                  width: '100%',
                  maxWidth: '300px'
                }}
              />
            </div>
          </div>

          {people.length > 0 && (
            <div style={{ 
              backgroundColor: 'white',
              padding: 'clamp(15px, 3vw, 20px)',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                marginBottom: 'clamp(15px, 3vw, 20px)',
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)'
              }}>支払い情報</h2>
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
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <label style={{ 
                        fontWeight: 'bold',
                        fontSize: 'clamp(1rem, 2vw, 1.1rem)'
                      }}>名前:</label>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                        style={{ 
                          padding: '12px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '1rem',
                          width: '100%'
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
                        fontSize: 'clamp(1rem, 2vw, 1.1rem)'
                      }}>支払額:</label>
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
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '1rem',
                            width: '100%'
                          }}
                        />
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#666',
                          marginTop: '5px'
                        }}>
                          計算結果: {person.amount}円
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={calculateWarikan}
                style={{
                  marginTop: 'clamp(15px, 3vw, 20px)',
                  padding: '12px 24px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  width: '100%',
                  maxWidth: '300px',
                  margin: '20px auto',
                  display: 'block'
                }}
              >
                計算する
              </button>
            </div>
          )}
        </div>

        {result && (
          <div style={{ 
            flex: '1 1 400px',
            backgroundColor: 'white',
            padding: 'clamp(15px, 3vw, 20px)',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(15px, 3vw, 20px)'
          }}>
            <h2 style={{ 
              marginBottom: 'clamp(15px, 3vw, 20px)',
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)'
            }}>計算結果</h2>
            <div style={{ 
              padding: 'clamp(15px, 3vw, 20px)',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              marginBottom: 'clamp(15px, 3vw, 20px)'
            }}>
              <p style={{ 
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                marginBottom: '0'
              }}>
                1人あたりの支払額: <span style={{ fontWeight: 'bold' }}>{result.average.toFixed(0)}円</span>
              </p>
            </div>

            <h3 style={{ 
              marginBottom: 'clamp(10px, 2vw, 15px)',
              fontSize: 'clamp(1.1rem, 2vw, 1.2rem)'
            }}>支払いの流れ</h3>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {result.payments.map((payment, index) => (
                <div key={index} style={{ 
                  padding: 'clamp(12px, 2vw, 15px)',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ color: '#f44336' }}>{payment.from}</span>
                  <span>→</span>
                  <span style={{ color: '#4CAF50' }}>{payment.to}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
                    {payment.amount.toFixed(0)}円
                  </span>
                </div>
              ))}
            </div>

            <h3 style={{ 
              marginTop: 'clamp(20px, 4vw, 30px)',
              marginBottom: 'clamp(10px, 2vw, 15px)',
              fontSize: 'clamp(1.1rem, 2vw, 1.2rem)'
            }}>各人の支払額の差分</h3>
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
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  fontSize: 'clamp(1rem, 2vw, 1.1rem)'
                }}>
                  {diff.name}: <span style={{ 
                    color: diff.difference > 0 ? '#4CAF50' : '#f44336',
                    fontWeight: 'bold'
                  }}>
                    {diff.difference > 0 ? '+' : ''}{diff.difference.toFixed(0)}円
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarikanCalculator; 