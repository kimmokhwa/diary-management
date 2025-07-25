import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { USER_ID } from '../../config/constants';
import { generateApprovalReport } from '../../utils/pdfGenerator';

const ApprovalManagementPanel = () => {
  const { create, read, remove, update } = useSupabase('approval_management');
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // 새로운 결재 입력 상태
  const [newApproval, setNewApproval] = useState({
    client_name: '',
    transaction_amount: '',
    memo: '',
    transaction_date: '',
    tax_invoice_issued: false
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

  // 결재 목록 불러오기
  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await read({ user_id: USER_ID });
      setApprovals(data);
    } catch (e) {
      alert('결재 정보 불러오기 실패: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // 결재 추가
  const handleAdd = async () => {
    if (!newApproval.client_name.trim() || !newApproval.transaction_amount) return;
    
    try {
      await create({ 
        user_id: USER_ID, 
        client_name: newApproval.client_name,
        transaction_amount: parseFloat(newApproval.transaction_amount),
        memo: newApproval.memo,
        transaction_date: newApproval.transaction_date || new Date().toISOString().split('T')[0],
        tax_invoice_issued: newApproval.tax_invoice_issued
      });
      
      // 입력 필드 초기화
      setNewApproval({
        client_name: '',
        transaction_amount: '',
        memo: '',
        transaction_date: '',
        tax_invoice_issued: false
      });
      
      fetchApprovals();
    } catch (e) {
      alert('결재 추가 실패: ' + e.message);
    }
  };

  // 결재 삭제
  const handleDelete = async (id) => {
    try {
      await remove(id);
      fetchApprovals();
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    }
  };

  // 세금계산서 발행 상태 변경
  const handleTaxInvoiceToggle = async (id, currentStatus) => {
    try {
      await update(id, { tax_invoice_issued: !currentStatus });
      fetchApprovals();
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
    const yearData = approvals.filter(approval => {
      const approvalYear = new Date(approval.transaction_date).getFullYear();
      return approvalYear === selectedYear;
    });
    
    if (yearData.length === 0) {
      alert(`${selectedYear}년 데이터가 없습니다.`);
      return;
    }
    
    await generateApprovalReport(yearData, selectedYear);
  };

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📋 결재 관리</h3>
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
            value={newApproval.client_name}
            onChange={e => setNewApproval({...newApproval, client_name: e.target.value})}
            onKeyPress={handleKeyPress}
            placeholder="거래처명"
          />
          <input
            className="w-64 border rounded px-2 py-1"
            type="number"
            value={newApproval.transaction_amount}
            onChange={e => setNewApproval({...newApproval, transaction_amount: e.target.value})}
            onKeyPress={handleKeyPress}
            placeholder="거래액"
          />
        </div>
        
        <input
          className="w-full border rounded px-2 py-1"
          value={newApproval.memo}
          onChange={e => setNewApproval({...newApproval, memo: e.target.value})}
          onKeyPress={handleKeyPress}
          placeholder="메모 (선택사항)"
        />
        
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1"
            type="date"
            value={newApproval.transaction_date}
            onChange={e => setNewApproval({...newApproval, transaction_date: e.target.value})}
            placeholder="거래일"
          />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={newApproval.tax_invoice_issued}
              onChange={e => setNewApproval({...newApproval, tax_invoice_issued: e.target.checked})}
            />
            <span className="text-sm">세금계산서 발행</span>
          </label>
        </div>
        
        <button
          className="bg-green-500 text-white px-3 py-1 rounded w-full"
          onClick={handleAdd}
          disabled={!newApproval.client_name.trim() || !newApproval.transaction_amount}
        >
          결재 추가
        </button>
      </div>

      {/* 결재 목록 */}
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <div className="space-y-2">
          {approvals.length > 0 ? (
            approvals.map(approval => (
              <div key={approval.id} className="border rounded p-3 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{approval.client_name}</div>
                    <div className="text-lg font-bold text-green-600">
                      {approval.transaction_amount?.toLocaleString()}원
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className={`px-2 py-1 rounded text-xs ${
                        approval.tax_invoice_issued 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => handleTaxInvoiceToggle(approval.id, approval.tax_invoice_issued)}
                    >
                      {approval.tax_invoice_issued ? '발행완료' : '미발행'}
                    </button>
                    <button 
                      className="text-red-500 text-xs"
                      onClick={() => handleDelete(approval.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  거래일: {approval.transaction_date}
                </div>
                {approval.memo && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600 text-xs">
                    📝 {approval.memo}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">
              등록된 결재 정보가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalManagementPanel; 