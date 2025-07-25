import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// HTML 요소를 캔버스로 변환하는 함수
const createCanvasFromHTML = async (htmlContent) => {
  // 임시 div 생성
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '800px';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.padding = '20px';
  tempDiv.style.fontFamily = 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif';
  tempDiv.style.fontSize = '12px';
  tempDiv.style.lineHeight = '1.5';
  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    return canvas;
  } finally {
    document.body.removeChild(tempDiv);
  }
};

export const generateTaxReport = async (taxData, year) => {
  // 통계 계산
  const totalTax = taxData.reduce((sum, tax) => sum + parseFloat(tax.tax_amount || 0), 0);
  const paidTax = taxData.filter(tax => tax.is_paid).reduce((sum, tax) => sum + parseFloat(tax.tax_amount || 0), 0);
  const unpaidTax = totalTax - paidTax;

  // HTML 콘텐츠 생성
  const htmlContent = `
    <div style="font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif;">
      <h1 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">${year}년 세금 관리 보고서</h1>
      
      <div style="margin-bottom: 20px;">
        <p><strong>생성일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-top: 0;">📊 세금 현황 요약</h2>
        <p><strong>총 세금액:</strong> ${totalTax.toLocaleString()}원</p>
        <p><strong>납부완료:</strong> ${paidTax.toLocaleString()}원</p>
        <p><strong>미납부:</strong> ${unpaidTax.toLocaleString()}원</p>
      </div>
      
      <div style="margin-top: 20px;">
        <h2 style="color: #2c3e50;">세금 상세 내역</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #3498db; color: white;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">세금종류</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">세금액</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">납부상태</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">납부기한</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">납부일</th>
            </tr>
          </thead>
          <tbody>
            ${taxData.map(tax => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${tax.tax_type}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${parseFloat(tax.tax_amount).toLocaleString()}원</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${tax.is_paid ? '#27ae60' : '#e74c3c'};">
                  ${tax.is_paid ? '납부완료' : '미납부'}
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${tax.due_date || '미설정'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${tax.paid_date || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  try {
    const canvas = await createCanvasFromHTML(htmlContent);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `세금관리_보고서_${year}년_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    alert('PDF 생성 중 오류가 발생했습니다.');
  }
};

export const generateApprovalReport = async (approvalData, year) => {
  // 통계 계산
  const totalAmount = approvalData.reduce((sum, approval) => sum + parseFloat(approval.transaction_amount || 0), 0);
  const issuedInvoices = approvalData.filter(approval => approval.tax_invoice_issued).length;
  const totalTransactions = approvalData.length;

  // HTML 콘텐츠 생성
  const htmlContent = `
    <div style="font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif;">
      <h1 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">${year}년 결재 관리 보고서</h1>
      
      <div style="margin-bottom: 20px;">
        <p><strong>생성일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-top: 0;">📊 결재 현황 요약</h2>
        <p><strong>총 거래액:</strong> ${totalAmount.toLocaleString()}원</p>
        <p><strong>총 거래건수:</strong> ${totalTransactions}건</p>
        <p><strong>세금계산서 발행:</strong> ${issuedInvoices}건</p>
      </div>
      
      <div style="margin-top: 20px;">
        <h2 style="color: #2c3e50;">결재 상세 내역</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #2ecc71; color: white;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">거래처</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">거래액</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">거래일</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">세금계산서</th>
            </tr>
          </thead>
          <tbody>
            ${approvalData.map(approval => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${approval.client_name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${parseFloat(approval.transaction_amount).toLocaleString()}원</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${approval.transaction_date}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${approval.tax_invoice_issued ? '#27ae60' : '#e74c3c'};">
                  ${approval.tax_invoice_issued ? '발행완료' : '미발행'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  try {
    const canvas = await createCanvasFromHTML(htmlContent);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `결재관리_보고서_${year}년_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    alert('PDF 생성 중 오류가 발생했습니다.');
  }
};

export const generateCombinedReport = async (taxData, approvalData, year) => {
  // 통계 계산
  const totalTax = taxData.reduce((sum, tax) => sum + parseFloat(tax.tax_amount || 0), 0);
  const paidTax = taxData.filter(tax => tax.is_paid).reduce((sum, tax) => sum + parseFloat(tax.tax_amount || 0), 0);
  const totalAmount = approvalData.reduce((sum, approval) => sum + parseFloat(approval.transaction_amount || 0), 0);
  const issuedInvoices = approvalData.filter(approval => approval.tax_invoice_issued).length;

  // HTML 콘텐츠 생성
  const htmlContent = `
    <div style="font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif;">
      <h1 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">${year}년 업무 관리 종합 보고서</h1>
      
      <div style="margin-bottom: 20px;">
        <p><strong>생성일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
      </div>
      
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1; background: #e8f5e9; padding: 15px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">💰 세금 현황</h2>
          <p><strong>총 세금액:</strong> ${totalTax.toLocaleString()}원</p>
          <p><strong>납부완료:</strong> ${paidTax.toLocaleString()}원</p>
          <p><strong>미납부:</strong> ${(totalTax - paidTax).toLocaleString()}원</p>
        </div>
        
        <div style="flex: 1; background: #e3f2fd; padding: 15px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">📋 결재 현황</h2>
          <p><strong>총 거래액:</strong> ${totalAmount.toLocaleString()}원</p>
          <p><strong>총 거래건수:</strong> ${approvalData.length}건</p>
          <p><strong>세금계산서 발행:</strong> ${issuedInvoices}건</p>
        </div>
      </div>
      
      ${taxData.length > 0 ? `
        <div style="margin-top: 20px;">
          <h2 style="color: #2c3e50;">세금 상세 내역</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #3498db; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">세금종류</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">금액</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">상태</th>
              </tr>
            </thead>
            <tbody>
              ${taxData.map(tax => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${tax.tax_type}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${parseFloat(tax.tax_amount).toLocaleString()}원</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${tax.is_paid ? '#27ae60' : '#e74c3c'};">
                    ${tax.is_paid ? '완료' : '미완료'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>
  `;

  try {
    const canvas = await createCanvasFromHTML(htmlContent);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `업무관리_종합보고서_${year}년_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    alert('PDF 생성 중 오류가 발생했습니다.');
  }
}; 