import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { USER_ID } from '../../config/constants';
import { generateTaxReport } from '../../utils/pdfGenerator';

const TaxManagementPanel = () => {
  const { create, read, remove, update } = useSupabase('tax_management');
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // 새로운 세금 입력 상태
  const [newTax, setNewTax] = useState({
    tax_type: '',
    tax_amount: '',
    memo: '',
    is_paid: false,
    due_date: '',
    paid_date: ''
  });
  
  // PDF 출력용 연도 선택
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 세금 목록 불러오기
  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const data = await read({ user_id: USER_ID });
      setTaxes(data);
    } catch (e) {
      alert('세금 정보 불러오기 실패: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  // 세금 추가
  const handleAdd = async () => {
    if (!newTax.tax_type.trim() || !newTax.tax_amount) return;
    
    try {
      await create({ 
        user_id: USER_ID, 
        tax_type: newTax.tax_type,
        tax_amount: parseFloat(newTax.tax_amount),
        memo: newTax.memo,
        is_paid: newTax.is_paid,
        due_date: newTax.due_date || null,
        paid_date: newTax.paid_date || null
      });
      
      // 입력 필드 초기화
      setNewTax({
        tax_type: '',
        tax_amount: '',
        memo: '',
        is_paid: false,
        due_date: '',
        paid_date: ''
      });
      
      fetchTaxes();
    } catch (e) {
      alert('세금 추가 실패: ' + e.message);
    }
  };

  // 세금 삭제
  const handleDelete = async (id) => {
    try {
      await remove(id);
      fetchTaxes();
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    }
  };

  // 납부 상태 변경
  const handlePaymentToggle = async (id, currentStatus) => {
    try {
      const paidDate = !currentStatus ? new Date().toISOString().split('T')[0] : null;
      await update(id, { 
        is_paid: !currentStatus,
        paid_date: paidDate
      });
      fetchTaxes();
    } catch (e) {
      alert('상태 변경 실패: ' + e.message);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  // PDF 보고서 생성
  const handleGenerateReport = async () => {
    const yearData = taxes.filter(tax => {
      const taxYear = tax.due_date ? new Date(tax.due_date).getFullYear() : new Date().getFullYear();
      return taxYear === selectedYear;
    });
    
    if (yearData.length === 0) {
      alert(`${selectedYear}년 데이터가 없습니다.`);
      return;
    }
    
    await generateTaxReport(yearData, selectedYear);
  };

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">💰 세금 관리</h3>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <option key={year} value={year}>{year}년</option>
              );
            })}
          </select>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded text-sm"
            onClick={handleGenerateReport}
          >
            📄 PDF 보고서
          </button>
        </div>
      </div>
      
      {/* 입력 폼 */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1"
            value={newTax.tax_type}
            onChange={e => setNewTax({...newTax, tax_type: e.target.value})}
            onKeyPress={handleKeyPress}
            placeholder="세금 종류 (예: 부가세, 소득세)"
          />
          <input
            className="w-64 border rounded px-2 py-1"
            type="number"
            value={newTax.tax_amount}
            onChange={e => setNewTax({...newTax, tax_amount: e.target.value})}
            onKeyPress={handleKeyPress}
            placeholder="금액"
          />
        </div>
        
        <input
          className="w-full border rounded px-2 py-1"
          value={newTax.memo}
          onChange={e => setNewTax({...newTax, memo: e.target.value})}
          onKeyPress={handleKeyPress}
          placeholder="메모 (선택사항)"
        />
        
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1"
            type="date"
            value={newTax.due_date}
            onChange={e => setNewTax({...newTax, due_date: e.target.value})}
            placeholder="납부기한"
          />
          <input
            className="border rounded px-2 py-1"
            type="date"
            value={newTax.paid_date}
            onChange={e => setNewTax({...newTax, paid_date: e.target.value})}
            placeholder="납부일"
          />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={newTax.is_paid}
              onChange={e => {
                const isPaid = e.target.checked;
                setNewTax({
                  ...newTax, 
                  is_paid: isPaid,
                  paid_date: isPaid && !newTax.paid_date ? new Date().toISOString().split('T')[0] : newTax.paid_date
                });
              }}
            />
            <span className="text-sm">납부완료</span>
          </label>
        </div>
        
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded w-full"
          onClick={handleAdd}
          disabled={!newTax.tax_type.trim() || !newTax.tax_amount}
        >
          세금 추가
        </button>
      </div>

      {/* 세금 목록 */}
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <div className="space-y-2">
          {taxes.length > 0 ? (
            taxes.map(tax => (
              <div key={tax.id} className="border rounded p-3 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{tax.tax_type}</div>
                    <div className="text-lg font-bold text-blue-600">
                      {tax.tax_amount?.toLocaleString()}원
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className={`px-2 py-1 rounded text-xs ${
                        tax.is_paid 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}
                      onClick={() => handlePaymentToggle(tax.id, tax.is_paid)}
                    >
                      {tax.is_paid ? '납부완료' : '미납부'}
                    </button>
                    <button 
                      className="text-red-500 text-xs"
                      onClick={() => handleDelete(tax.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>납부기한:</span>
                    <span className={tax.due_date && new Date(tax.due_date) < new Date() && !tax.is_paid ? 'text-red-600 font-semibold' : ''}>
                      {tax.due_date || '미설정'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>납부일:</span>
                    <span className={tax.paid_date ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                      {tax.paid_date || '미납부'}
                    </span>
                  </div>
                  {tax.memo && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600">
                      📝 {tax.memo}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">
              등록된 세금 정보가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaxManagementPanel; 