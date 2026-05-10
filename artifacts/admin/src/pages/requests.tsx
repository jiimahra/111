import { useState } from "react";
import { useRequests, useDeleteRequest, useUpdateRequestStatus } from "@/hooks/use-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, AlertCircle } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Requests() {
  const { data, isLoading, error } = useRequests();
  const deleteRequest = useDeleteRequest();
  const updateStatus = useUpdateRequestStatus();
  const { toast } = useToast();
  
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  const handleDelete = () => {
    if (!requestToDelete) return;
    
    deleteRequest.mutate(requestToDelete, {
      onSuccess: () => {
        toast({ title: "Request deleted", description: "The request has been successfully removed." });
        setRequestToDelete(null);
      },
      onError: (err: any) => {
        toast({ title: "Error deleting request", description: err.message, variant: "destructive" });
        setRequestToDelete(null);
      }
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast({ title: "Status updated", description: `Request status changed to ${status}.` });
      },
      onError: (err: any) => {
        toast({ title: "Error updating status", description: err.message, variant: "destructive" });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "in-progress": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (error) {
    return <div className="text-destructive flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Failed to load requests.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage community help requests.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                data?.requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium truncate max-w-[200px]">{req.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{req.description}</div>
                      <div className="text-xs text-muted-foreground mt-1 font-medium">{req.contactPhone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal bg-background">
                        {req.category}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">{req.helpType}</div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{req.location}</TableCell>
                    <TableCell>
                      {format(new Date(req.createdAt), "MMM d")}
                      <div className="text-xs text-muted-foreground">{req.postedBy}</div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={req.status} 
                        onValueChange={(val) => handleStatusChange(req.id, val)}
                        disabled={updateStatus.isPending}
                      >
                        <SelectTrigger className={`h-8 w-[130px] border-none font-medium ${getStatusColor(req.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setRequestToDelete(req.id)}
                        disabled={deleteRequest.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteRequest.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
