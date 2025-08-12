import jsPDF from 'jspdf';
import 'jspdf-autotable';

// CSV Export Functions
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Export Functions
export const exportUsersToPDF = (users: any[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('User Management Report', 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
  
  // User table
  const tableData = users.map(user => [
    user.firstName + ' ' + user.lastName,
    user.email,
    user.role,
    user.isActive ? 'Active' : 'Inactive',
    new Date(user.createdAt).toLocaleDateString(),
    user.itemsListed || 0,
    user.totalBookings || 0
  ]);

  (doc as any).autoTable({
    startY: 40,
    head: [['Name', 'Email', 'Role', 'Status', 'Join Date', 'Items Listed', 'Total Bookings']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 }
  });

  doc.save('users-report.pdf');
};

export const exportProductsToPDF = (products: any[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Product Management Report', 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
  
  // Product table
  const tableData = products.map(product => [
    product.name,
    product.category?.name || 'N/A',
    product.owner?.firstName + ' ' + product.owner?.lastName,
    `$${product.price}`,
    product.isAvailable ? 'Available' : 'Unavailable',
    new Date(product.createdAt).toLocaleDateString(),
    product.totalBookings || 0
  ]);

  (doc as any).autoTable({
    startY: 40,
    head: [['Product Name', 'Category', 'Owner', 'Price', 'Status', 'Listed Date', 'Bookings']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 }
  });

  doc.save('products-report.pdf');
};

export const exportBookingsToPDF = (bookings: any[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Booking Management Report', 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
  
  // Booking table
  const tableData = bookings.map(booking => [
    booking.product?.name || 'N/A',
    booking.customer?.firstName + ' ' + booking.customer?.lastName,
    new Date(booking.startDate).toLocaleDateString(),
    new Date(booking.endDate).toLocaleDateString(),
    `$${booking.totalAmount}`,
    booking.status,
    new Date(booking.createdAt).toLocaleDateString()
  ]);

  (doc as any).autoTable({
    startY: 40,
    head: [['Product', 'Customer', 'Start Date', 'End Date', 'Amount', 'Status', 'Booked Date']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 }
  });

  doc.save('bookings-report.pdf');
};

export const exportAnalyticsToPDF = (stats: any) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Platform Analytics Report', 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
  
  // Key metrics
  doc.setFontSize(14);
  doc.text('Key Metrics', 14, 50);
  
  const metrics = [
    ['Total Users', stats.totalUsers || 0],
    ['Total Products', stats.totalProducts || 0],
    ['Total Bookings', stats.totalBookings || 0],
    ['Active Rentals', stats.activeRentals || 0],
    ['Total Revenue', `$${stats.totalRevenue || 0}`],
    ['Monthly Revenue', `$${stats.monthlyRevenue || 0}`]
  ];

  (doc as any).autoTable({
    startY: 60,
    head: [['Metric', 'Value']],
    body: metrics,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 }
  });

  // Revenue by category
  if (stats.revenueByCategory && stats.revenueByCategory.length > 0) {
    doc.setFontSize(14);
    doc.text('Revenue by Category', 14, 120);
    
    const categoryData = stats.revenueByCategory.map((cat: any) => [
      cat.category,
      `$${cat.revenue}`,
      cat.count
    ]);

    (doc as any).autoTable({
      startY: 130,
      head: [['Category', 'Revenue', 'Bookings']],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 }
    });
  }

  doc.save('analytics-report.pdf');
};

export const exportFeedbackToPDF = (feedback: any[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('User Feedback Report', 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
  
  // Feedback table
  const tableData = feedback.map(item => [
    item.user?.firstName + ' ' + item.user?.lastName,
    item.category,
    item.subject,
    item.status,
    new Date(item.createdAt).toLocaleDateString(),
    item.reply ? 'Replied' : 'Pending'
  ]);

  (doc as any).autoTable({
    startY: 40,
    head: [['User', 'Category', 'Subject', 'Status', 'Date', 'Response']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 }
  });

  doc.save('feedback-report.pdf');
};

// Log Export Functions
export const exportLogsToCSV = (logs: any[], filename: string) => {
  const logData = logs.map(log => ({
    timestamp: new Date(log.timestamp).toLocaleString(),
    level: log.level,
    message: log.message,
    userId: log.userId || 'N/A',
    action: log.action || 'N/A',
    ipAddress: log.ipAddress || 'N/A'
  }));

  exportToCSV(logData, filename);
};

export const exportLogsToPDF = (logs: any[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('System Logs Report', 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
  
  // Logs table
  const tableData = logs.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.level,
    log.message.substring(0, 50) + (log.message.length > 50 ? '...' : ''),
    log.userId || 'N/A',
    log.action || 'N/A'
  ]);

  (doc as any).autoTable({
    startY: 40,
    head: [['Timestamp', 'Level', 'Message', 'User ID', 'Action']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 7 }
  });

  doc.save('system-logs.pdf');
};
