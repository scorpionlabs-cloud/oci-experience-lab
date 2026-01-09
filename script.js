// Simple lab data model
const labs = {
  compute: {
    title: "Compute: Launch Your First Instance",
    level: "Beginner",
    time: "20–30 min",
    cost: "Low (small test shape)",
    overview:
      "In this lab you will create a small test VM instance in a private subnet, accessible via a public load balancer or bastion.",
    steps: [
      "Log in to the OCI Console and switch to a non-production compartment.",
      "Ensure you have a VCN with at least one public and one private subnet.",
      "Navigate to Compute → Instances and click Create instance.",
      "Choose a small shape (e.g., VM.Standard.E4.Flex) and a recent Oracle Linux image.",
      "Place the instance in a private subnet and provide an SSH key.",
      "Optionally, attach a block volume for data.",
      "Verify the instance state is RUNNING and test connectivity via bastion or session manager."
    ],
    cli: `# Example: launch instance using OCI CLI (adapt to your tenancy)
oci compute instance launch \\
  --compartment-id <compartment_ocid> \\
  --availability-domain "<AD_NAME>" \\
  --shape "VM.Standard.E4.Flex" \\
  --shape-config '{"ocpus": 1, "memory-in-gbs": 8}' \\
  --display-name "lab-compute-1" \\
  --subnet-id <private_subnet_ocid> \\
  --assign-public-ip false \\
  --ssh-authorized-keys-file ~/.ssh/id_rsa.pub`,
    terraform: `resource "oci_core_instance" "lab_compute" {
  compartment_id      = var.compartment_ocid
  availability_domain = var.ad_name
  display_name        = "lab-compute-1"
  shape               = "VM.Standard.E4.Flex"

  shape_config {
    memory_in_gbs = 8
    ocpus         = 1
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.private.id
    assign_public_ip = false
  }

  metadata = {
    ssh_authorized_keys = file("~/.ssh/id_rsa.pub")
  }
}`
  },

  networking: {
    title: "Networking: Build a Public + Private VCN",
    level: "Beginner",
    time: "25–35 min",
    cost: "Low",
    overview:
      "Create a VCN that uses a public subnet for load balancers and a private subnet for application instances.",
    steps: [
      "Go to Networking → Virtual Cloud Networks → Create VCN.",
      "Choose 'VCN with Internet Connectivity' as a starting point.",
      "Create one public subnet (for load balancers / bastion) and one private subnet (for app / DB).",
      "Attach an Internet Gateway to the VCN.",
      "Create a NAT Gateway for outbound traffic from private subnets.",
      "Configure route tables so private subnets use the NAT Gateway.",
      "Use Network Security Groups to restrict traffic by app tier."
    ],
    cli: `# Example: create VCN and subnets (simplified)
oci network vcn create \\
  --compartment-id <compartment_ocid> \\
  --cidr-block 10.0.0.0/16 \\
  --display-name "lab-vcn"

# Then create public/private subnets, gateways, and route rules
# (recommend using Terraform for repeatability).`,
    terraform: `resource "oci_core_vcn" "lab_vcn" {
  cidr_block     = "10.0.0.0/16"
  compartment_id = var.compartment_ocid
  display_name   = "lab-vcn"
}

resource "oci_core_subnet" "public" {
  cidr_block                 = "10.0.1.0/24"
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.lab_vcn.id
  display_name               = "public-subnet"
  prohibit_public_ip_on_vnic = false
}

resource "oci_core_subnet" "private" {
  cidr_block                 = "10.0.2.0/24"
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.lab_vcn.id
  display_name               = "private-subnet"
  prohibit_public_ip_on_vnic = true
}`
  },

  storage: {
    title: "Storage: Upload and Retrieve Objects",
    level: "Beginner",
    time: "15–20 min",
    cost: "Very Low",
    overview:
      "Use Object Storage to store and retrieve files – a common building block for backups, logs, and artifacts.",
    steps: [
      "Go to Object Storage → Buckets → Create bucket.",
      "Select the correct compartment and region, and choose Standard storage tier.",
      "Create a private bucket named 'lab-objects'.",
      "Upload a small test file through the console.",
      "Generate a pre-authenticated request (PAR) to share the file securely.",
      "Optionally, access the object using the OCI CLI."
    ],
    cli: `# Create a bucket
oci os bucket create \\
  --compartment-id <compartment_ocid> \\
  --name lab-objects

# Upload a file
oci os object put \\
  --bucket-name lab-objects \\
  --file ./example.txt

# List objects
oci os object list \\
  --bucket-name lab-objects`,
    terraform: `resource "oci_objectstorage_bucket" "lab_bucket" {
  compartment_id = var.compartment_ocid
  name           = "lab-objects"
  namespace      = var.os_namespace
  storage_tier   = "Standard"
}`
  },

  db: {
    title: "Database: Create a Managed Database",
    level: "Intermediate",
    time: "30–45 min",
    cost: "Medium (short-lived lab)",
    overview:
      "Provision a managed database such as Autonomous Database or MySQL HeatWave for a test workload.",
    steps: [
      "Go to Databases → Autonomous Database (or MySQL HeatWave).",
      "Click Create and choose a workload type (e.g., transaction processing).",
      "Assign the DB to your lab compartment and choose a small compute size.",
      "Use a private endpoint if possible, within your lab VCN.",
      "Download credentials and test connectivity from a compute instance in the same VCN.",
      "Run a simple CREATE TABLE and INSERT test."
    ],
    cli: `# Example (simplified) Autonomous Database create
oci db autonomous-database create \\
  --compartment-id <compartment_ocid> \\
  --db-name LABDB \\
  --display-name "lab-autonomous-db" \\
  --db-workload OLTP \\
  --cpu-core-count 1 \\
  --data-storage-size-in-tbs 1 \\
  --admin-password "<StrongPassword123>"`,
    terraform: `resource "oci_database_autonomous_database" "lab_db" {
  compartment_id              = var.compartment_ocid
  db_name                     = "LABDB"
  display_name                = "lab-autonomous-db"
  db_workload                 = "OLTP"
  cpu_core_count              = 1
  data_storage_size_in_tbs    = 1
  admin_password              = var.db_admin_password
  is_auto_scaling_enabled     = true
}`
  },

  oke: {
    title: "OKE: Deploy a Containerized App",
    level: "Intermediate",
    time: "40–60 min",
    cost: "Medium",
    overview:
      "Provision an Oracle Kubernetes Engine (OKE) cluster and deploy a simple web application.",
    steps: [
      "Go to Developer Services → Kubernetes Clusters (OKE).",
      "Click Create cluster and pick a quick-create or custom cluster.",
      "Ensure worker nodes are placed in private subnets with proper security rules.",
      "Download the kubeconfig file and merge it with your local kubeconfig.",
      "Run 'kubectl get nodes' to confirm connectivity.",
      "Deploy a sample app (e.g., nginx) using a Deployment and Service.",
      "Expose the app via a LoadBalancer service and test from your browser."
    ],
    cli: `# After OKE cluster is created and kubeconfig is downloaded
kubectl get nodes

kubectl create deployment lab-nginx --image=nginx

kubectl expose deployment lab-nginx \\
  --port=80 --target-port=80 --type=LoadBalancer

kubectl get svc`,
    terraform: `# OKE is typically provisioned via terraform modules.
# This is a placeholder showing where OKE resources would live.

module "oke" {
  source           = "./modules/oke"
  compartment_ocid = var.compartment_ocid
  vcn_id           = oci_core_vcn.lab_vcn.id
  # ...
}`
  },

  observability: {
    title: "Observability: Metrics, Logs & Alarms",
    level: "Intermediate",
    time: "20–30 min",
    cost: "Low",
    overview:
      "Use OCI Monitoring, Logging, and Alarms to see what your services are doing and get alerted when things go wrong.",
    steps: [
      "Enable logging for your compute instances, load balancers, and OKE clusters.",
      "Open Logging → Log Explorer and filter logs by resource.",
      "Go to Monitoring → Metrics Explorer and find metrics for CPU, memory (if enabled), and network.",
      "Create an alarm for 'CPU utilization over 70% for 5 minutes' on your lab instance.",
      "Configure Notifications (Email or PagerDuty) as the alarm destination.",
      "Trigger the alarm by running a CPU-heavy command on the instance, then check notifications."
    ],
    cli: `# Example: list metrics for a resource (simplified)
oci monitoring metric-data summarize-metrics-data \\
  --compartment-id <compartment_ocid> \\
  --query-text "CpuUtilization[1m].mean()" \\
  --namespace oci_computeagent`,
    terraform: `resource "oci_monitoring_alarm" "cpu_high" {
  compartment_id  = var.compartment_ocid
  display_name    = "lab-high-cpu"
  is_enabled      = true
  severity        = "CRITICAL"

  query = "CpuUtilization[5m].mean() > 70"

  destinations = [var.notification_topic_ocid]
}`
  },

  iam: {
    title: "IAM & Governance: Least Privilege & Tagging",
    level: "Intermediate",
    time: "20–30 min",
    cost: "None",
    overview:
      "Create groups, policies, and tags to control who can do what in your tenancy and how resources are tracked.",
    steps: [
      "Create a compartment for lab workloads (e.g., 'lab-env').",
      "Create a group named 'lab-admins'.",
      "Write IAM policies that allow the group to manage only the lab compartment.",
      "Enable tag namespaces and define required tags (e.g., 'Project', 'Owner', 'Environment').",
      "Update lab resources to include these tags.",
      "Review the Audit logs to see who did what and when."
    ],
    cli: `# Example IAM policy text (define in Console or via Terraform)
Allow group lab-admins to manage all-resources in compartment lab-env

# Tagging example in Terraform:
#   freeform_tags = {
#     Project     = "oci-experience-lab"
#     Environment = "lab"
#     Owner       = "your-name"
#   }`,
    terraform: `resource "oci_identity_compartment" "lab_env" {
  compartment_id = var.tenancy_ocid
  description    = "Lab environment compartment"
  name           = "lab-env"
}

resource "oci_identity_tag_namespace" "lab_ns" {
  compartment_id = var.tenancy_ocid
  description    = "Common lab tags"
  name           = "lab"
}

resource "oci_identity_tag" "lab_project" {
  tag_namespace_id = oci_identity_tag_namespace.lab_ns.id
  name             = "Project"
  description      = "Project name"
}`
  },

  interconnect: {
    title: "Interconnect Simulation: OCI ↔ Other Cloud / On-Prem",
    level: "Intermediate",
    time: "25–35 min",
    cost: "Depends on link (FastConnect / VPN)",
    overview:
      "Simulate how a private interconnect between OCI and another environment (AWS, Azure, GCP, or on-prem) is designed, provisioned, and tested. This lab is conceptual: use it to understand the flow before deploying real connectivity.",
    steps: [
      "Choose a peer environment (for example: AWS VPC, Azure VNet, GCP VPC, or on-prem data center).",
      "Design IP ranges so there is no overlap between the OCI VCN CIDRs and the peer network CIDRs.",
      "In OCI, create or identify a DRG (Dynamic Routing Gateway) attached to the lab VCN.",
      "Decide on connectivity type: FastConnect (via partner / colocation) or IPSec VPN.",
      "On the peer side, configure the equivalent (e.g., AWS Direct Connect + VGW, or a VPN gateway).",
      "Exchange BGP details, pre-shared keys (for VPN), and confirm routing advertisements.",
      "Test end-to-end connectivity between an OCI private instance and a host in the peer network.",
      "Apply network security (NSGs, security groups, firewalls) so only required ports are reachable."
    ],
    cli: `# HIGH LEVEL EXAMPLE (FastConnect + virtual circuit, many details omitted):
# 1) Create / use a DRG
oci network drg create \\
  --compartment-id <compartment_ocid> \\
  --display-name "lab-drg"

# 2) Attach DRG to VCN
oci network drg-attachment create \\
  --drg-id <drg_ocid> \\
  --vcn-id <vcn_ocid> \\
  --display-name "lab-drg-attachment"

# 3) Work with your FastConnect provider or VPN gateway
# to establish the physical or IPSec connection and BGP.

# NOTE: For real deployments, follow the official OCI
# interconnect guides step by step.`,
    terraform: `# Simplified example of a DRG attached to a VCN.
# Real FastConnect / VPN setups will include more resources and parameters.

resource "oci_core_drg" "lab_drg" {
  compartment_id = var.compartment_ocid
  display_name   = "lab-drg"
}

resource "oci_core_drg_attachment" "lab_drg_attach" {
  drg_id        = oci_core_drg.lab_drg.id
  display_name  = "lab-drg-attachment"
  vcn_id        = oci_core_vcn.lab_vcn.id
}

# Additional resources would be needed for:
# - IPSec connections (VPN)
# - FastConnect virtual circuits
# - Routing and security configuration`
  }
};

// DOM references
const labContentEl = document.getElementById("lab-content");
const labNavButtons = document.querySelectorAll(".lab-nav");
const openLabButtons = document.querySelectorAll(".open-lab");
const progressListItems = document.querySelectorAll("#lab-progress li");

// Render lab
function renderLab(id) {
  const lab = labs[id];
  if (!lab) return;

  // Update nav active state
  labNavButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lab === id);
  });

  const stepsHtml = lab.steps
    .map((s, i) => `<li><strong>Step ${i + 1}.</strong> ${s}</li>`)
    .join("");

  const cliBlock = lab.cli
    ? codeBlockHtml(lab.cli, `${id}-cli`, "OCI CLI example")
    : "";
  const tfBlock = lab.terraform
    ? codeBlockHtml(lab.terraform, `${id}-tf`, "Terraform example")
    : "";

  const simBlock = id === "interconnect" ? interconnectSimulationHtml() : "";

  labContentEl.innerHTML = `
    <h3>${lab.title}</h3>
    <div class="lab-meta">
      <span class="badge level">${lab.level}</span>
      <span class="badge time">Estimated: ${lab.time}</span>
      <span class="badge cost">Cost: ${lab.cost}</span>
    </div>
    <p>${lab.overview}</p>

    <ol class="steps-list">
      ${stepsHtml}
    </ol>

    ${cliBlock}
    ${tfBlock}
    ${simBlock}

    <button class="btn primary" id="mark-complete" data-lab="${id}">
      Mark lab as complete ✔
    </button>
  `;

  attachCodeCopyHandlers();
  attachMarkCompleteHandler();
  if (id === "interconnect") {
    initInterconnectSimulation();
  }
}

// Helper to build code block HTML
function codeBlockHtml(code, id, label) {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `
  <div class="code-block" data-code-id="${id}">
    <div class="code-actions">
      <button class="copy-btn" data-copy="${id}">Copy</button>
    </div>
    <div class="tiny">${label}</div>
    <pre><code>${escaped}</code></pre>
  </div>
  `;
}

// Interconnect simulation block HTML
function interconnectSimulationHtml() {
  return `
    <div class="sim-card">
      <h4>Interconnect Simulation</h4>
      <p class="sim-note">
        Click through the phases to visualize how traffic flows between OCI and
        another environment over a private link. No real connectivity is created –
        this is a mental model you can reuse in real designs.
      </p>

      <div class="sim-graph">
        <div class="sim-node oci" id="sim-node-oci">
          OCI VCN
          <span>10.0.0.0/16</span>
        </div>
        <div class="sim-link" id="sim-link">
          <div class="sim-link-line">
            <div class="sim-link-line-inner" id="sim-link-line-inner"></div>
          </div>
          <div class="sim-link-status" id="sim-link-status">
            Phase: Plan (no link yet)
          </div>
        </div>
        <div class="sim-node peer" id="sim-node-peer">
          Peer Network
          <span>172.31.0.0/16 (AWS / On-Prem)</span>
        </div>
      </div>

      <div class="sim-steps">
        <button class="sim-step-btn active" data-phase="plan" id="sim-phase-plan">
          1. Plan
        </button>
        <button class="sim-step-btn" data-phase="provision" id="sim-phase-provision">
          2. Provision
        </button>
        <button class="sim-step-btn" data-phase="test" id="sim-phase-test">
          3. Test
        </button>
      </div>

      <div class="sim-step-labels">
        <span>🧠 Plan: CIDR, routing, security, BGP design</span>
        <span>⚙️ Provision: DRG, FastConnect / VPN, peer gateway</span>
        <span>✅ Test: ping, traceroute, app reachability</span>
      </div>

      <p class="sim-status-text" id="sim-status-text">
        Current phase: Plan — verify no overlapping CIDRs and define which subnets
        need to talk across the link.
      </p>
    </div>
  `;
}

// Copy to clipboard
function attachCodeCopyHandlers() {
  const copyButtons = document.querySelectorAll(".copy-btn");
  copyButtons.forEach((btn) => {
    btn.onclick = () => {
      const codeId = btn.dataset.copy;
      const block = document.querySelector(
        `.code-block[data-code-id="${codeId}"] pre code`
      );
      if (!block) return;
      const text = block.innerText;
      navigator.clipboard
        .writeText(text)
        .then(() => {
          const original = btn.textContent;
          btn.textContent = "Copied!";
          setTimeout(() => {
            btn.textContent = original;
          }, 1200);
        })
        .catch(() => {
          alert("Copy failed. Please copy manually.");
        });
    };
  });
}

// Progress tracking in localStorage
const PROGRESS_KEY = "oci-lab-progress";

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function updateProgressUI() {
  const progress = loadProgress();
  progressListItems.forEach((li) => {
    const id = li.getAttribute("data-lab-id");
    const done = progress[id];
    const label = li.textContent.replace(/^[☑☐]\s*/, "");
    li.classList.toggle("completed", !!done);
    li.textContent = `${done ? "☑" : "☐"} ${label}`;
  });
}

function attachMarkCompleteHandler() {
  const btn = document.getElementById("mark-complete");
  if (!btn) return;
  btn.onclick = () => {
    const id = btn.dataset.lab;
    const progress = loadProgress();
    progress[id] = true;
    saveProgress(progress);
    updateProgressUI();
  };
}

// Interconnect simulation logic
function initInterconnectSimulation() {
  const link = document.getElementById("sim-link");
  const linkInner = document.getElementById("sim-link-line-inner");
  const linkStatus = document.getElementById("sim-link-status");
  const statusText = document.getElementById("sim-status-text");
  const btnPlan = document.getElementById("sim-phase-plan");
  const btnProvision = document.getElementById("sim-phase-provision");
  const btnTest = document.getElementById("sim-phase-test");
  const buttons = [btnPlan, btnProvision, btnTest];

  function setPhase(phase) {
    buttons.forEach((b) => {
      if (!b) return;
      b.classList.toggle("active", b.dataset.phase === phase);
    });

    if (!link || !linkInner || !linkStatus || !statusText) return;

    if (phase === "plan") {
      link.classList.remove("active");
      linkInner.style.width = "0%";
      linkStatus.textContent = "Phase: Plan (no link yet)";
      statusText.textContent =
        "Current phase: Plan — verify no overlapping CIDRs, decide which subnets should communicate, and decide on FastConnect vs VPN.";
    } else if (phase === "provision") {
      link.classList.add("active");
      linkInner.style.width = "70%";
      linkStatus.textContent = "Phase: Provisioning (link coming up)";
      statusText.textContent =
        "Current phase: Provision — DRG attached, FastConnect or VPN being established, BGP sessions negotiated, routes exchanged.";
    } else if (phase === "test") {
      link.classList.add("active");
      linkInner.style.width = "100%";
      linkStatus.textContent = "Phase: Test (link up, traffic flowing)";
      statusText.textContent =
        "Current phase: Test — you can ping between private hosts, run traceroute, and test application connectivity across clouds.";
    }
  }

  if (btnPlan) btnPlan.onclick = () => setPhase("plan");
  if (btnProvision) btnProvision.onclick = () => setPhase("provision");
  if (btnTest) btnTest.onclick = () => setPhase("test");

  // Default phase
  setPhase("plan");
}

// Wire nav buttons
labNavButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.lab;
    renderLab(id);
  });
});

// Wire service tiles
openLabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.lab;
    renderLab(id);
    document.getElementById("labs").scrollIntoView({ behavior: "smooth" });
  });
});

// Initial state
renderLab("compute");
updateProgressUI();
