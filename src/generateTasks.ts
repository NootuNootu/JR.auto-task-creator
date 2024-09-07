import * as SDK from "azure-devops-extension-sdk";
import {
	WorkItem,
	WorkItemTrackingRestClient
} from "azure-devops-extension-api/WorkItemTracking";
import { getClient } from "azure-devops-extension-api";

SDK.init().then(() => {
	SDK.register(SDK.getContributionId(), () => ({
		execute: async (context: Context) => {
			const client = getClient(WorkItemTrackingRestClient, {
				sessionId: context.tfsContext.sessionId,
				rootPath: context.tfsContext.contextData.host.uri
			});

			const currentWorkItem = await client.getWorkItem(context.workItemId);

			if (context.workItemTypeName === "Story") {
				await createStoryTasks(client, context, currentWorkItem);
				alert("Tasks Created");
			} else if (context.workItemTypeName === "Bug") {
				await createBugTasks(client, context, currentWorkItem);
				alert("Tasks Created");
			} else {
				alert("Invalid Work Item Type");
			}
		}
	}));
});

const createStoryTasks = async (
	client: WorkItemTrackingRestClient,
	context: Context,
	currentWorkItem: WorkItem
) => {
	await createCodeReview(client, context, currentWorkItem);
	await createTestConditions(client, context, currentWorkItem);
	await createTestReview(client, context, currentWorkItem);
	await createTestExecution(client, context, currentWorkItem);
};

const createBugTasks = async (
	client: WorkItemTrackingRestClient,
	context: Context,
	currentWorkItem: WorkItem
) => {
	await createFix(client, context, currentWorkItem);
	await createCodeReview(client, context, currentWorkItem);
	await createRetest(client, context, currentWorkItem);
};

const createFix = (
	client: WorkItemTrackingRestClient,
	context: Context,
	currentWorkItem: WorkItem
) =>
	createWorkItem({
		client,
		context,
		title: "Fix",
		currentWorkItem,
		activity: "Development",
		assignedTo: context.tfsContext.currentIdentity.displayName
	});

const createCodeReview = (
	client: WorkItemTrackingRestClient,
	context: Context,
	currentWorkItem: WorkItem
) =>
	createWorkItem({
		client,
		context,
		title: "Code Review",
		currentWorkItem,
		activity: "Development"
	});

const createTestConditions = (
	client: WorkItemTrackingRestClient,
	context: Context,
	currentWorkItem: WorkItem
) =>
	createWorkItem({
		client,
		context,
		title: "Test Conditions",
		currentWorkItem,
		activity: "Testing"
	});

const createTestReview = (
	client: WorkItemTrackingRestClient,
	context: Context,
	currentWorkItem: WorkItem
) =>
	createWorkItem({
		client,
		context,
		title: "Test Review",
		currentWorkItem,
		activity: "Development",
		assignedTo: context.tfsContext.currentIdentity.displayName,
		originalEstimate: 0.5
	});

const createTestExecution = (
	client: WorkItemTrackingRestClient,
	context: Context,
	currentWorkItem: WorkItem
) =>
	createWorkItem({
		client,
		context,
		title: "Test Execution",
		currentWorkItem,
		activity: "Testing"
	});

const createRetest = (
	client: WorkItemTrackingRestClient,
	context: Context,
	currentWorkItem: WorkItem
) =>
	createWorkItem({
		client,
		context,
		title: "Retest",
		currentWorkItem,
		activity: "Testing"
	});

const createWorkItem = async ({
	client,
	context,
	currentWorkItem,
	title,
	activity,
	originalEstimate,
	assignedTo
}: CreateWorkItemArgs) => {
	const patchDoc = [
		{
			op: "add",
			path: "/fields/System.Title",
			value: title
		},
		{
			op: "add",
			path: "/fields/System.TeamProject",
			value: currentWorkItem.fields["System.TeamProject"]
		},
		{
			op: "add",
			path: "/fields/System.AreaPath",
			value: currentWorkItem.fields["System.AreaPath"]
		},
		{
			op: "add",
			path: "/fields/System.IterationPath",
			value: currentWorkItem.fields["System.IterationPath"]
		},
		{
			op: "add",
			path: "/fields/Microsoft.VSTS.Common.Activity",
			value: activity
		},
		{
			op: "add",
			path: "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate",
			value: originalEstimate ?? 0
		},
		{
			op: "add",
			path: "/relations/-",
			value: {
				rel: "System.LinkTypes.Hierarchy-Reverse",
				url: currentWorkItem.url
			}
		}
	];

	if (assignedTo) {
		patchDoc.push({
			op: "add",
			path: "/fields/System.AssignedTo",
			value: assignedTo
		});
	}

	if (originalEstimate) {
		patchDoc.push({
			op: "add",
			path: "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
			value: originalEstimate
		});
	}

	await client.createWorkItem(patchDoc, context.currentProjectGuid, "Task");
};

interface CreateWorkItemArgs {
	client: WorkItemTrackingRestClient;
	context: Context;
	title: string;
	currentWorkItem: WorkItem;
	activity: string;
	assignedTo?: string;
	originalEstimate?: number;
}

interface Context {
	currentProjectGuid: string;
	workItemId: number;
	workItemTypeName: string;
	tfsContext: {
		sessionId: string;
		contextData: {
			host: {
				uri: string;
			};
		};
		currentIdentity: {
			displayName: string;
		};
	};
}
