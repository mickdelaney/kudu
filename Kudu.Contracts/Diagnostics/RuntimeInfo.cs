using System.Collections.Generic;
using System.Runtime.Serialization;

namespace Kudu.Services.Diagnostics
{
    [DataContract(Name = "runtime")]
    public class RuntimeInfo
    {
        [DataMember]
        public IEnumerable<string> NetFrameworkVersions { get; set; }

        [DataMember]
        public IEnumerable<string> NodeVersions { get; set; }

        [DataMember]
        public IEnumerable<string> PhpVersions { get; set; }

        [DataMember]
        public IEnumerable<string> JavaVersions { get; set; }

        [DataMember]
        public Dictionary<string, IEnumerable<string>> JavaContainers { get; set; }

        [DataMember]
        public IEnumerable<string> PythonVersions { get; set; }

        [DataMember]
        public Dictionary<string, IEnumerable<string>> SiteExtensions { get; set; }
    }
}
