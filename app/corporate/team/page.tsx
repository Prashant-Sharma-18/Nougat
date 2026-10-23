"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/components/UserContext";
import { fetchTeamMembers, createTeamMember, sendGiftCardToTeamMember } from "@/actions/team";
import { getBrandCatalog } from "@/actions/catalog";
import { formatPoints } from "@/lib/utils";
import { 
  Users, 
  Plus, 
  Gift, 
  Building2, 
  Search, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  ShieldCheck, 
  ArrowRight,
  Send,
  X,
  CreditCard,
  Briefcase
} from "lucide-react";
import Link from "next/link";

export default function CorporateTeamPage() {
  const { currentUser, refreshUserData } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDeptId, setNewDeptId] = useState("dept_eng");
  const [newTitle, setNewTitle] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  // Send Gift Modal State
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [giftBrandId, setGiftBrandId] = useState("");
  const [giftFaceValue, setGiftFaceValue] = useState<number>(50);
  const [giftMessage, setGiftMessage] = useState("Outstanding leadership on the Q3 release!");
  const [sendingGift, setSendingGift] = useState(false);

  const departments = [
    { id: "dept_eng", name: "Engineering & Cloud Infrastructure", code: "ENG-401" },
    { id: "dept_sales", name: "Global Sales & Strategic Partnerships", code: "SLS-202" },
    { id: "dept_ops", name: "Customer Operations & Support", code: "OPS-103" },
    { id: "dept_hr", name: "People, Culture & Talent Acquisition", code: "HR-501" },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, brandsData] = await Promise.all([
        fetchTeamMembers(),
        getBrandCatalog({ onlyActive: true }),
      ]);
      setMembers(membersData);
      setBrands(brandsData);
      if (brandsData.length > 0 && !giftBrandId) {
        setGiftBrandId(brandsData[0].id);
      }
    } catch (e: any) {
      setFeedback({ message: e.message || "Failed to load team directory.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    try {
      setAddingMember(true);
      const dept = departments.find((d) => d.id === newDeptId);
      const res = await createTeamMember({
        name: newName,
        email: newEmail,
        departmentId: newDeptId,
        departmentName: dept?.name || "Corporate Operations",
        title: newTitle || "Team Member",
      });
      if (res.success) {
        setFeedback({ message: `Added ${res.member.name} to the corporate team directory.` });
        setIsAddModalOpen(false);
        setNewName("");
        setNewEmail("");
        setNewTitle("");
        await loadData();
      }
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    } finally {
      setAddingMember(false);
    }
  };

  const handleSendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !giftBrandId || !currentUser) return;

    try {
      setSendingGift(true);
      const res = await sendGiftCardToTeamMember({
        memberId: selectedMember.id,
        brandId: giftBrandId,
        faceValue: Number(giftFaceValue),
        giftMessage,
        senderUserId: currentUser.id,
      });

      if (res.success) {
        setFeedback({
          message: `Dispatched $${giftFaceValue} gift card to ${selectedMember.name} (${selectedMember.email})! Order #${res.orderId} fulfilled.`,
        });
        setSelectedMember(null);
        await loadData();
        await refreshUserData();
      }
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    } finally {
      setSendingGift(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCards = members.reduce((sum, m) => sum + m.totalCardsReceived, 0);
  const totalValue = members.reduce((sum, m) => sum + m.totalValueReceived, 0);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in ${
            feedback.isError ? "bg-zinc-100 border border-zinc-300 text-zinc-900" : "bg-zinc-950 text-white"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-mono text-zinc-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-950 text-white font-medium">
                Corporate Team Directory
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Acme Corp [ORG-8821]
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Team Members & Direct Gifting.
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Maintain your organization's team roster, track gift cards awarded to each employee, and disburse digital reward vouchers directly to team members with one click.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
            <div>
              <span className="text-zinc-400 text-[10px] uppercase block">Listed Team</span>
              <span className="font-bold text-zinc-950 text-lg">{members.length}</span>
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <span className="text-zinc-400 text-[10px] uppercase block">Disbursed Cards</span>
              <span className="font-bold text-zinc-950 text-lg">{totalCards}</span>
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <span className="text-zinc-400 text-[10px] uppercase block">Total Value</span>
              <span className="font-bold text-zinc-950 text-lg">${totalValue}.00</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6">
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/bulk-rewards"
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors"
            >
              Bulk CSV Disburser
            </Link>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Team Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Team Roster Table */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-950" />
            <h2 className="text-sm font-semibold text-zinc-950">Listed Team Directory ({filteredMembers.length})</h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Direct Fulfillment Engine</span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-400 font-mono">
            No team members matched your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                  <th className="pb-2 font-medium">Team Member</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Department Cost Center</th>
                  <th className="pb-2 font-medium">Awards Received</th>
                  <th className="pb-2 font-medium">Last Gifted</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-zinc-900">{member.name}</div>
                      <div className="text-[10px] text-zinc-400 font-sans">{member.title}</div>
                    </td>
                    <td className="py-3 text-zinc-600">{member.email}</td>
                    <td className="py-3">
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[10px] font-medium border border-zinc-200">
                        {member.departmentName.split(" ")[0]}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-zinc-950">{member.totalCardsReceived} cards</span>
                      <span className="text-[10px] text-zinc-400 block">${member.totalValueReceived}.00 total</span>
                    </td>
                    <td className="py-3 text-zinc-500 text-[11px]">
                      {member.lastGiftedAt ? new Date(member.lastGiftedAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setGiftMessage(`Spot Recognition Award for ${member.name}. Outstanding contribution to Acme Corp!`);
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors inline-flex items-center gap-1 shadow-xs"
                      >
                        <Gift className="h-3 w-3" />
                        <span>Send Gift Card</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Add Team Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h3 className="text-sm font-bold">Add Listed Team Member</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-5 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-500 uppercase text-[10px] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-zinc-500 uppercase text-[10px] mb-1">Company Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.l@acmecorp.internal"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-zinc-500 uppercase text-[10px] mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Staff Security Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-zinc-500 uppercase text-[10px] mb-1">Cost Center Department</label>
                <select
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-zinc-400"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-4 py-2 rounded-lg bg-zinc-950 text-white font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {addingMember ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Send Gift Card Directly */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <div>
                  <h3 className="text-sm font-bold">Issue Corporate Gift Card</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Recipient: {selectedMember.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendGift} className="p-5 space-y-4 text-xs font-mono">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                <div className="flex justify-between text-zinc-700">
                  <span>Recipient:</span>
                  <span className="font-semibold text-zinc-950">{selectedMember.name}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Email:</span>
                  <span>{selectedMember.email}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Cost Center:</span>
                  <span>{selectedMember.departmentName}</span>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 uppercase text-[10px] mb-1">Select Brand</label>
                <select
                  value={giftBrandId}
                  onChange={(e) => setGiftBrandId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-zinc-400"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (${b.minAmount} - ${b.maxAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 uppercase text-[10px] mb-1">Denomination (USD)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[25, 50, 100, 200].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGiftFaceValue(val)}
                      className={`py-1.5 rounded-lg border text-center transition-colors ${
                        giftFaceValue === val
                          ? "bg-zinc-950 text-white border-zinc-950 font-bold"
                          : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-zinc-500 block">
                  Required Points: {formatPoints(giftFaceValue * 100)} pts
                </span>
              </div>

              <div>
                <label className="block text-zinc-500 uppercase text-[10px] mb-1">Corporate Recognition Note</label>
                <textarea
                  rows={2}
                  required
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-zinc-400 font-sans text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingGift}
                  className="px-4 py-2 rounded-lg bg-zinc-950 text-white font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {sendingGift ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Fulfilling & Delivering...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Authorize & Dispatch Voucher</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

