/**
 * Error Boundary Component
 * จัดการ errors ที่เกิดขึ้นใน React components
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="เกิดข้อผิดพลาด"
          subTitle="ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"
          extra={
            <Button type="primary" onClick={this.handleReset}>
              กลับไปหน้าแรก
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

