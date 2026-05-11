import { useState } from "react";
import { useUsers, useDeleteUser, useBlockUser, useUnblockUser } from "@/hooks/use-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const DURATION_OPTIONS = [
  { label: "3 Mahine (3 Months)", value: "3m" },
  { label: "6 Mahine (6 Months)", value: "6m" },
  { label: "12 Mahine (1 Year)", value: "12m" },
  { label: "5 Saal (5 Years)", value: "5y" },
  { label: "Permanent Ban", value: "permanent" },
];

function getBlockLabel(blockedUntil: string | null): string {
  if (!blockedUntil) return "";
  const d = new Date(blockedUntil);
  if (d.getFullYear() >= 9999) return "Permanent";
  return `Blocked till ${format(d, "dd MMM yyyy")}`;
}

export default function Users() {
  const { data, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const { toast } = useToast();

  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState("3m");
  const [blockReason, setBlockReason] = useState("");
  const [unblockTarget, setUnblockTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = () => {
    if (!userToDelete) return;
    deleteUser.mutate(userToDelete, {
      onSuccess: () => {
        toast({ title: "User deleted", description: "User account permanently removed." });
        setUserToDelete(null);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setUserToDelete(null);
      },
    });
  };

  const handleBlock = () => {
    if (!blockTarget) return;
    blockUser.mutate(
      { id: blockTarget.id, duration: selectedDuration, reason: blockReason.trim() || undefined },
      {
        onSuccess: () => {
          const durLabel = DURATION_OPTIONS.find((d) => d.value === selectedDuration)?.label ?? selectedDuration;
          toast({ title: "User Blocked", description: `${blockTarget.name} ko ${durLabel} ke liye block kar diya gaya.` });
          setBlockTarget(null);
          setBlockReason("");
          setSelectedDuration("3m");
        },
        onError: (err: any) => {
          toast({ title: "Block Failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleUnblock = () => {
    if (!unblockTarget) return;
    unblockUser.mutate(unblockTarget.id, {
      onSuccess: () => {
        toast({ title: "User Unblocked", description: `${unblockTarget.name} ka account ab unblock ho gaya.` });
        setUnblockTarget(null);
      },
      onError: (err: any) => {
        toast({ title: "Unblock Failed", description: err.message, variant: "destructive" });
      },
    });
  };

  if (error) {
    return <div className="text-destructive">Failed to load users.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform members — block, unblock, or delete accounts.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                data?.users.map((user) => {
                  const isBlocked = !!user.blockedUntil;
                  const isPermanent = isBlocked && new Date(user.blockedUntil!).getFullYear() >= 9999;
                  return (
                    <TableRow key={user.id} className={isBlocked ? "bg-red-50/60" : ""}>
                      <TableCell className="font-medium">
                        {user.name || "Unknown"}
                        {user.saharaId && <div className="text-xs text-muted-foreground">{user.saharaId}</div>}
                      </TableCell>
                      <TableCell>
                        <div>{user.phone || "-"}</div>
                        <div className="text-xs text-muted-foreground">{user.email || "-"}</div>
                      </TableCell>
                      <TableCell>{user.location || "-"}</TableCell>
                      <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {isBlocked ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 inline-block w-fit">
                              {isPermanent ? "Permanent Ban" : "Blocked"}
                            </span>
                            {!isPermanent && user.blockedUntil && (
                              <span className="text-xs text-red-500">
                                till {format(new Date(user.blockedUntil), "dd MMM yyyy")}
                              </span>
                            )}
                            {user.blockReason && (
                              <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={user.blockReason}>
                                {user.blockReason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {user.isAdmin ? "Admin" : "Active"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isBlocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 h-8 text-xs"
                              onClick={() => setUnblockTarget({ id: user.id, name: user.name ?? "User" })}
                              disabled={unblockUser.isPending}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-700 border-orange-200 hover:bg-orange-50 hover:text-orange-800 h-8 text-xs"
                              onClick={() => setBlockTarget({ id: user.id, name: user.name ?? "User" })}
                              disabled={blockUser.isPending}
                            >
                              <ShieldOff className="h-3.5 w-3.5 mr-1" />
                              Block
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                            onClick={() => setUserToDelete(user.id)}
                            disabled={deleteUser.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteUser.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Dialog */}
      <Dialog open={!!blockTarget} onOpenChange={(open) => { if (!open) { setBlockTarget(null); setBlockReason(""); setSelectedDuration("3m"); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-orange-600" />
              Block User — {blockTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Block duration chuniye. Blocked user login nahi kar payega aur use message dikhega.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Block Duration</Label>
              <div className="grid grid-cols-1 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDuration(opt.value)}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors ${
                      selectedDuration === opt.value
                        ? "border-orange-500 bg-orange-50 text-orange-800"
                        : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 text-gray-700"
                    }`}
                  >
                    {opt.label}
                    {opt.value === "permanent" && (
                      <span className="ml-2 text-xs text-red-600 font-semibold">(Irreversible via app)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Block Reason <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. Spam, abusive behavior, fraud..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setBlockTarget(null); setBlockReason(""); setSelectedDuration("3m"); }}>
              Cancel
            </Button>
            <Button
              onClick={handleBlock}
              disabled={blockUser.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {blockUser.isPending ? "Blocking..." : "Block User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock Confirm Dialog */}
      <AlertDialog open={!!unblockTarget} onOpenChange={(open) => !open && setUnblockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User Unblock Karein?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{unblockTarget?.name}</strong> ka account unblock ho jayega aur wo dobara login kar sakenge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblock}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {unblockUser.isPending ? "Unblocking..." : "Haan, Unblock Karein"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
