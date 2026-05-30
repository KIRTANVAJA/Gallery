import { useEffect, useState } from 'react'
import { getLocalInquiries, type LocalInquiry as Inquiry } from '../../utils/localDB'

export function InquiryInbox() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])

  useEffect(() => {
    setInquiries(getLocalInquiries())
  }, [])

  return (
    <div className="border border-white/10">
      <h3 className="font-display text-cream p-6 border-b border-white/10">Inquiries & Bookings</h3>
      {inquiries.length === 0 ? (
        <p className="p-8 text-cream-muted text-sm font-body">No inquiries yet.</p>
      ) : (
        <ul>
          {inquiries.map((inq) => (
            <li key={inq._id} className="p-6 border-b border-white/5 hover:bg-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-cream font-body">{inq.name}</p>
                  <p className="text-cream-muted text-xs">{inq.email}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-gold">{inq.type}</span>
              </div>
              <p className="mt-4 text-sm text-cream-muted font-body">{inq.message}</p>
              <p className="mt-2 text-[10px] text-cream-muted/50">
                {new Date(inq.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
